import base64
import logging
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import sqlite3
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from twilio.rest import Client
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager, contextmanager

load_dotenv()

# Initialize FastAPI app
app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load resources
model = joblib.load("random_forest_model.joblib")
distance_matrix = pd.read_csv('distance_matrix.csv')
df = pd.read_csv("enhanced_dataset.csv")

# Database connection with context manager
@contextmanager
def get_db():
    conn = sqlite3.connect("waste_management.db")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Predict waste for today
def predict_waste_for_today(house_ids, day_encoded, is_holiday, neighborhood_encoded, weather_encoded, previous_day_waste):
    today_data = pd.DataFrame({
        'house_id': house_ids,
        'day_encoded': [day_encoded] * len(house_ids),
        'isholiday': [is_holiday] * len(house_ids),
        'neighborhood_encoded': neighborhood_encoded,
        'weather_encoded': [weather_encoded] * len(house_ids),
        'previous_day_waste': previous_day_waste
    })
    predictions = model.predict(today_data)
    today_data['predicted_waste_weight'] = predictions
    return today_data

# Pydantic models
class DayDetails(BaseModel):
    day: str
    is_holiday: int
    weather: str
    date: str
    truck_capacity: float

class OptimalRouteResponse(BaseModel):
    optimal_route: List[int]

class VisitTimeUpdate(BaseModel):
    house_id: int

class PhoneNumberUpdate(BaseModel):
    house_id: int
    phone_number: str

class HouseVisitDetailResponse(BaseModel):
    house_id: int
    last_visited_date: str
    phone_number: str
    is_scheduled_today: bool

class QueryRequest(BaseModel):
    house_id: int
    phone_number: str
    query: str

class QueryResponse(BaseModel):
    id: int
    house_id: int
    phone_number: str
    query: str
    status: str
    created_at: str
    image: Optional[bytes] = None

class QueryStatusUpdate(BaseModel):
    query_id: int

class WasteRequestCreate(BaseModel):
    house_id: int
    date: str
    description: str

class WasteRequestResponse(BaseModel):
    id: int
    house_id: int
    date: str
    description: str
    status: str
    created_at: str

class LastVisitedDateResponse(BaseModel):
    house_id: int
    last_visited_date: str

# Lifespan event handler for database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS houses (
                house_id INTEGER PRIMARY KEY,
                visited INTEGER DEFAULT 0
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                optimal_route TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS route_distances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER,
                from_house_id INTEGER,
                to_house_id INTEGER,
                distance REAL,
                FOREIGN KEY(route_id) REFERENCES routes(id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                house_id INTEGER,
                FOREIGN KEY(house_id) REFERENCES houses(house_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS house_visits (
                house_id INTEGER PRIMARY KEY,
                last_visited_date TEXT DEFAULT NULL,
                phone_number TEXT DEFAULT '+919945100418'
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                house_id INTEGER NOT NULL,
                phone_number TEXT NOT NULL,
                query TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                image BLOB
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS waste_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                house_id INTEGER,
                date TEXT,
                description TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(house_id) REFERENCES houses(house_id)
            )
        """)
        db.commit()
    yield

app.lifespan = lifespan

# Endpoints
@app.post("/get-optimal-route", response_model=OptimalRouteResponse)
def get_optimal_route(details: DayDetails):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT optimal_route FROM routes WHERE date = ?", (details.date,))
        existing_route = cursor.fetchone()
        if existing_route:
            return {"optimal_route": list(map(lambda x: int(float(x)), existing_route["optimal_route"].split(',')))}

        cursor.execute("SELECT house_id FROM houses WHERE visited = 0")
        unvisited_houses = cursor.fetchall()

        if not unvisited_houses:
            cursor.execute("UPDATE houses SET visited = 0")
            db.commit()
            return get_optimal_route(details)

        house_ids = [house["house_id"] for house in unvisited_houses]
        today_data = df[df['house_id'].isin(house_ids)]
        neighborhood_encoded = today_data['neighborhood_encoded'].values
        previous_day_waste = today_data['previous_day_waste'].values

        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        weather_conditions = ["Sunny", "Rainy", "Cloudy"]
        day_encoded = days_of_week.index(details.day)
        weather_encoded = weather_conditions.index(details.weather)

        predictions = predict_waste_for_today(
            house_ids=house_ids,
            day_encoded=day_encoded,
            is_holiday=details.is_holiday,
            neighborhood_encoded=neighborhood_encoded,
            weather_encoded=weather_encoded,
            previous_day_waste=previous_day_waste
        )

        predictions.sort_values(by="predicted_waste_weight", ascending=False, inplace=True)

        selected_houses = []
        current_weight = 0
        for _, row in predictions.iterrows():
            if current_weight + row["predicted_waste_weight"] <= details.truck_capacity:
                selected_houses.append(row["house_id"])
                current_weight += row["predicted_waste_weight"]
            if current_weight >= details.truck_capacity:
                break

        optimal_route = sorted(selected_houses)

        cursor.execute("INSERT INTO routes (date, optimal_route) VALUES (?, ?)", (details.date, ",".join(map(str, optimal_route))))
        db.commit()

        route_id = cursor.lastrowid
        for i in range(len(optimal_route) - 1):
            from_house_id = optimal_route[i]
            to_house_id = optimal_route[i + 1]
            from_house_id = int(from_house_id)
            to_house_id = int(to_house_id)
            distance = distance_matrix.iloc[from_house_id, to_house_id]
            cursor.execute("""
                INSERT INTO route_distances (route_id, from_house_id, to_house_id, distance)
                VALUES (?, ?, ?, ?)
            """, (route_id, from_house_id, to_house_id, distance))
        db.commit()

        cursor.executemany("UPDATE houses SET visited = 1 WHERE house_id = ?", [(h,) for h in selected_houses])
        db.commit()

        visit_date = details.date
        cursor.executemany("INSERT INTO visits (date, house_id) VALUES (?, ?)", [(visit_date, h) for h in selected_houses])
        db.commit()

        return {"optimal_route": optimal_route}

@app.get("/get-visit-history-all", response_model=List[Dict])
def get_visit_history(date: Optional[str] = None):
    with get_db() as db:
        cursor = db.cursor()
        if date:
            cursor.execute("""
                SELECT date, optimal_route 
                FROM routes 
                WHERE date = ?
            """, (date,))
        else:
            cursor.execute("""
                SELECT date, optimal_route 
                FROM routes
            """)
        
        routes = cursor.fetchall()
        return [{"date": row["date"], 
                 "house_ids": [int(float(house_id)) for house_id in row["optimal_route"].split(',')]} 
                for row in routes]

@app.get("/get-visit-history", response_model=List[Dict])
def get_visit_history(date: Optional[str] = None):
    with get_db() as db:
        cursor = db.cursor()
        if date:
            cursor.execute("""
                SELECT r.date, r.optimal_route
                FROM routes r
                WHERE r.date = ?
            """, (date,))
        else:
            cursor.execute("""
                SELECT r.date, r.optimal_route
                FROM routes r
            """)
        
        routes = cursor.fetchall()
        visit_history = []

        for row in routes:
            date = row[0]
            optimal_route = row[1].split(',')
            house_visits = []
            for house_id in optimal_route:
                cursor.execute("""
                    SELECT hv.last_visited_date, hv.phone_number
 squeezing                    FROM house_visits hv
                    WHERE hv.house_id = ?
                """, (house_id,))
                house_visit_data = cursor.fetchone()
                if house_visit_data:
                    house_visits.append({
                        "house_id": house_id,
                        "last_visited_date": house_visit_data[0],
                        "phone_number": house_visit_data[1]
                    })
            visit_history.append({
                "date": date,
                "houses": house_visits
            })
        return visit_history

@app.get("/get-last-visited-date", response_model=List[LastVisitedDateResponse])
def get_last_visited_date():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("""
            SELECT house_id, MAX(date) AS last_visited_date
            FROM visits
            GROUP BY house_id
        """)
        last_visited_dates = cursor.fetchall()
        return [{"house_id": row["house_id"], "last_visited_date": row["last_visited_date"]} for row in last_visited_dates]

@app.post("/set-phone-number")
def set_phone_number(update: PhoneNumberUpdate):
    with get_db() as db:
        house_id = update.house_id
        phone_number = update.phone_number
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO house_visits (house_id, phone_number) 
            VALUES (?, ?) 
            ON CONFLICT(house_id) 
            DO UPDATE SET phone_number=excluded.phone_number
        """, (house_id, phone_number))
        db.commit()
        return {"message": f"Phone number set for house {house_id}"}

account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
client = Client(account_sid, auth_token)

@app.post("/update-visit-time")
def update_visit_time(update: VisitTimeUpdate):
    with get_db() as db:
        house_id = update.house_id
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO house_visits (house_id, last_visited_date) 
            VALUES (?, ?) 
            ON CONFLICT(house_id) 
            DO UPDATE SET last_visited_date=excluded.last_visited_date
        """, (house_id, now))
        db.commit()
        cursor.execute("SELECT phone_number FROM house_visits WHERE house_id = ?", (house_id,))
        row = cursor.fetchone()
        if row and row["phone_number"]:
            try:
                client.messages.create(
                    messaging_service_sid=os.getenv('TWILIO_MESSAGING_SERVICE_SID'),
                    body=f"House {house_id} was visited at {now}",
                    to=row["phone_number"]
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to send SMS: {e}")
        return {"message": f"Visit time updated for house {house_id} at {now}"}

@app.get("/get-distance")
def get_distance(house1: int, house2: int):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("""
            SELECT distance FROM route_distances 
            WHERE (from_house_id = ? AND to_house_id = ?) 
            OR (from_house_id = ? AND to_house_id = ?)
        """, (house1, house2, house2, house1))
        if row := cursor.fetchone():
            return {"distance": row["distance"]}
        else:
            raise HTTPException(status_code=404, detail="Distance not found between the given houses.")

@app.get("/get-visit-info", response_model=List[HouseVisitDetailResponse])
def get_visit_info(date: str, house_id: int):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("""
            SELECT hv.last_visited_date, hv.phone_number
            FROM house_visits hv
            WHERE hv.house_id = ?
        """, (house_id,))
        house_visit_data = cursor.fetchone()
        if not house_visit_data:
            return {"error": "House not found"}
        last_visited_date, phone_number = house_visit_data
        today = datetime.today().date()
        is_scheduled_today = False
        cursor.execute("""
            SELECT r.date, r.optimal_route
            FROM routes r
            WHERE r.date = ? AND (
                r.optimal_route LIKE ? OR
                r.optimal_route LIKE ? OR
                r.optimal_route LIKE ?
            )
        """, (date, 
              f'{house_id}.0,%',
              f'%,{house_id}.0,%',
              f'%,{house_id}.0'))
        route_data = cursor.fetchone()
        if route_data:
            is_scheduled_today = True
        response = {
            "house_id": house_id,
            "last_visited_date": last_visited_date if last_visited_date else "N/A",
            "phone_number": phone_number if phone_number else "N/A",
            "is_scheduled_today": is_scheduled_today
        }
        return [response]

def clean_text(text):
    if isinstance(text, bytes):
        try:
            return text.decode('utf-8')
        except UnicodeDecodeError:
            return text.decode('utf-8', errors='replace')
    elif isinstance(text, str):
        try:
            text.encode('utf-8').decode('utf-8')
            return text
        except UnicodeDecodeError:
            return text.encode('utf-8', errors='replace').decode('utf-8')
    return text

# Endpoint to add a new query with optional image
@app.post("/add-query", response_model=QueryResponse)
async def add_query(
    house_id: int = Form(...),
    phone_number: str = Form(...),
    query: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    with get_db() as db:
        cursor = db.cursor()
        
        # Clean text inputs
        cleaned_phone_number = clean_text(phone_number)
        cleaned_query = clean_text(query)
        
        # Read and validate image data if provided
        image_data = None
        if image:
            if image.content_type not in ["image/jpeg", "image/png"]:
                raise HTTPException(status_code=400, detail="Only JPEG or PNG images are supported")
            image_data = await image.read()
        
        # Insert query with image data
        cursor.execute("""
            INSERT INTO user_queries (house_id, phone_number, query, image)
            VALUES (?, ?, ?, ?)
        """, (house_id, cleaned_phone_number, cleaned_query, image_data))
        
        db.commit()
        query_id = cursor.lastrowid
        cursor.execute("SELECT * FROM user_queries WHERE id = ?", (query_id,))
        new_query = cursor.fetchone()
        
        # Encode image as base64 for response
        image_base64 = None
        if new_query["image"]:
            try:
                image_base64 = base64.b64encode(new_query["image"]).decode('utf-8')
            except Exception as e:
                logger.error(f"Error encoding image for query ID {query_id}: {e}")
        
        # Construct response
        response = {
            "id": new_query["id"],
            "house_id": new_query["house_id"],
            "phone_number": clean_text(new_query["phone_number"]),
            "query": clean_text(new_query["query"]),
            "status": clean_text(new_query["status"]),
            "created_at": clean_text(new_query["created_at"]),
            "image": image_base64
        }
        
        return response

# Endpoint to get all queries
@app.get("/get-queries", response_model=List[QueryResponse])
def get_queries():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT id, house_id, phone_number, query, status, created_at, image FROM user_queries")
        queries = cursor.fetchall()
        
        cleaned_queries = []
        for query in queries:
            try:
                # Encode image as base64 if present
                image_base64 = None
                if query["image"]:
                    try:
                        image_base64 = base64.b64encode(query["image"]).decode('utf-8')
                    except Exception as e:
                        raise 
                print("stsdtud",query["status"])
                cleaned_query = {
                    "id": query["id"],
                    "house_id": query["house_id"],
                    "phone_number": clean_text(query["phone_number"]),
                    "query": clean_text(query["query"]),
                    "status": query["status"],
                    "created_at": clean_text(query["created_at"]),
                    "image": image_base64
                }
                cleaned_queries.append(cleaned_query)
            except Exception as e:
                continue
        
        return cleaned_queries


@app.patch("/mark-query-done")
def mark_query_done(update: QueryStatusUpdate):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("""
            UPDATE user_queries 
            SET status = 'done'
            WHERE id = ?
        """, (update.query_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Query not found")
        db.commit()
        return {"message": f"Query {update.query_id} marked as done"}

@app.post("/request-extra-waste-pickup", response_model=WasteRequestResponse)
def request_extra_waste_pickup(request: WasteRequestCreate):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT 1 FROM house_visits WHERE house_id = ?", (request.house_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="House not found")
        try:
            request_date = datetime.strptime(request.date, "%Y-%m-%d").date()
            if request_date < datetime.today().date():
                raise HTTPException(status_code=400, detail="Cannot request pickup for a past date")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        cursor.execute("""
            INSERT INTO waste_requests (house_id, date, description)
            VALUES (?, ?, ?)
        """, (request.house_id, request.date, request.description))
        db.commit()
        request_id = cursor.lastrowid
        cursor.execute("SELECT * FROM waste_requests WHERE id = ?", (request_id,))
        new_request = cursor.fetchone()
        return dict(new_request)

@app.get("/get-waste-requests", response_model=List[WasteRequestResponse])
def get_waste_requests():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM waste_requests ORDER BY created_at DESC")
        requests = cursor.fetchall()
        return [dict(req) for req in requests]

class WasteRequestStatusUpdate(BaseModel):
    request_id: int
    status: str

@app.post("/update-waste-request", response_model=WasteRequestResponse)
def update_waste_request_status(request: WasteRequestStatusUpdate):
    if request.status != "completed":
        raise HTTPException(status_code=400, detail="Status must be 'completed'")
    
    with get_db() as db:
        cursor = db.cursor()
        
        # Check if the waste request exists
        cursor.execute("SELECT * FROM waste_requests WHERE id = ?", (request.request_id,))
        waste_request = cursor.fetchone()
        if not waste_request:
            raise HTTPException(status_code=404, detail="Waste request not found")
        
        # Update the status
        cursor.execute("""
            UPDATE waste_requests
            SET status = ?
            WHERE id = ?
        """, (request.status, request.request_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Failed to update waste request status")
        
        db.commit()
        
        # Fetch the updated waste request
        cursor.execute("SELECT * FROM waste_requests WHERE id = ?", (request.request_id,))
        updated_request = cursor.fetchone()
        
        return dict(updated_request)