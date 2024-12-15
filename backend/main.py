from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import sqlite3
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from twilio.rest import Client
# from twilio import twilio_client
import os
from dotenv import load_dotenv
import os

load_dotenv()  # This will load the environment variables from the .env file

# Initialize FastAPI app
app = FastAPI()

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Load the trained model and other resources
model = joblib.load("random_forest_model.joblib")
distance_matrix = pd.read_csv('distance_matrix.csv')
df = pd.read_csv("enhanced_dataset.csv")

# Database connection function
def get_db():
    conn = sqlite3.connect("waste_management.db")
    conn.row_factory = sqlite3.Row
    return conn

# TSP Nearest Neighbor for route calculation
def tsp_nearest_neighbor(distance_matrix, start=0):
    n = len(distance_matrix)
    visited = [False] * n
    route = [start]
    visited[start] = True

    while len(route) < n:
        last = route[-1]
        next_city = np.argmin([distance_matrix.iloc[last, j] if not visited[j] else float('inf') for j in range(n)])
        route.append(next_city)
        visited[next_city] = True

    return route

# Predict waste for today for multiple houses
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


# Table Model

    
    
class OptimalRouteResponse(BaseModel):
    optimal_route: List[int]
    
    
class VisitTimeUpdate(BaseModel):
    house_id: int

class PhoneNumberUpdate(BaseModel):
    house_id: int
    phone_number: str

# Route to get optimal route
@app.post("/get-optimal-route", response_model=OptimalRouteResponse)
def get_optimal_route(details: DayDetails, db=Depends(get_db)):
    cursor = db.cursor()
    print("test")

    cursor.execute("SELECT optimal_route FROM routes WHERE date = ?", (details.date,))
    existing_route = cursor.fetchone()
    if existing_route:
        return {"optimal_route": list(map(lambda x: int(float(x)), existing_route["optimal_route"].split(',')))}

    cursor.execute("SELECT house_id FROM houses WHERE visited = 0")
    unvisited_houses = cursor.fetchall()

    if not unvisited_houses:
        cursor.execute("UPDATE houses SET visited = 0")
        db.commit()
        return get_optimal_route(details, db)

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

    selected_indices = [np.where(house_ids == house)[0][0] for house in selected_houses]
    selected_distance_matrix = distance_matrix.iloc[selected_indices, selected_indices]
    tsp_route = tsp_nearest_neighbor(selected_distance_matrix)
    optimal_route = [selected_houses[i] for i in tsp_route]

    # Insert the route into the 'routes' table
    cursor.execute("INSERT INTO routes (date, optimal_route) VALUES (?, ?)", (details.date, ",".join(map(str, optimal_route))))
    db.commit()

    # Save distances between consecutive houses in the optimal route
    print("tddest")
    
    # Assuming `distance_matrix` is correctly indexed and formatted
# Save distances between consecutive houses in the optimal route
    route_id = cursor.lastrowid
    for i in range(len(optimal_route) - 1):
        from_house_id = optimal_route[i]
        to_house_id = optimal_route[i + 1]
        from_house_id = int(from_house_id)  # Convert float to int
        to_house_id = int(to_house_id)      # Convert float to int
        distance = distance_matrix.iloc[from_house_id,to_house_id]
        cursor.execute("""
            INSERT INTO route_distances (route_id, from_house_id, to_house_id, distance)
            VALUES (?, ?, ?, ?)
        """, (route_id, from_house_id, to_house_id, distance))
        print((route_id, from_house_id, to_house_id, distance))
    db.commit()

    

    # Update visited status for the selected houses and save them in the visit records
    cursor.executemany("UPDATE houses SET visited = 1 WHERE house_id = ?", [(h,) for h in selected_houses])
    db.commit()

    visit_date = details.date
    cursor.executemany("INSERT INTO visits (date, house_id) VALUES (?, ?)", [(visit_date, h) for h in selected_houses])
    db.commit()

    return {"optimal_route": optimal_route}




@app.get("/get-visit-history-all", response_model=List[Dict])
def get_visit_history(date: Optional[str] = None, db=Depends(get_db)):
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
    
    # Convert optimal_route from text to list of house_ids, handling floats and integers
    return [{"date": row["date"], 
             "house_ids": [int(float(house_id)) if house_id.isdigit() else int(float(house_id)) 
                           for house_id in row["optimal_route"].split(',')]} 
            for row in routes]



# Get visit history with optional date filtering
@app.get("/get-visit-history", response_model=List[Dict])
def get_visit_history(date: Optional[str] = None, db=Depends(get_db)):
    cursor = db.cursor()
    
    # SQL query to get the routes based on date (if provided)
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

    # For each route (date and list of house IDs), fetch the visit details for each house
    for row in routes:
        date = row[0]
        optimal_route = row[1].split(',')  # Split the optimal_route into list of house_ids

        house_visits = []
        for house_id in optimal_route:
            # Query to fetch the last_visited_date and phone_number for the house
            cursor.execute("""
                SELECT hv.last_visited_date, hv.phone_number
                FROM house_visits hv
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



# Pydantic model for last visited date
class LastVisitedDateResponse(BaseModel):
    house_id: int
    last_visited_date: str

# Get the last visited date for all houses
@app.get("/get-last-visited-date", response_model=List[LastVisitedDateResponse])
def get_last_visited_date(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT house_id, MAX(date) AS last_visited_date
        FROM visits
        GROUP BY house_id
    """)
    last_visited_dates = cursor.fetchall()
    return [{"house_id": row["house_id"], "last_visited_date": row["last_visited_date"]} for row in last_visited_dates]

# Initialize database schema on startup
@app.on_event("startup")
def startup():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS house_visits (
            house_id INTEGER PRIMARY KEY,
            last_visited_date TEXT DEFAULT NULL,
            phone_number TEXT DEFAULT '+919945100418'
        )
    """)
    db.commit()
    db.close()

# Set phone number for a specific house
@app.post("/set-phone-number")
def set_phone_number(update: PhoneNumberUpdate, db=Depends(get_db)):
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

# Update visit time for a house and send an SMS
@app.post("/update-visit-time")
def update_visit_time(update: VisitTimeUpdate, db=Depends(get_db)):
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
                messaging_service_sid= os.getenv('TWILIO_MESSAGING_SERVICE_SID'),
                body=f"House {house_id} was visited at {now}",
                to=row["phone_number"]
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send SMS: {e}")

    return {"message": f"Visit time updated for house {house_id} at {now}"}



@app.get("/get-distance")
def get_distance(house1: int, house2: int, db=Depends(get_db)):
    cursor = db.cursor()

    # Query the distance from the route_distances table
    cursor.execute("""
        SELECT distance FROM route_distances 
        WHERE (from_house_id = ? AND to_house_id = ?) 
        OR (from_house_id = ? AND to_house_id = ?)
    """, (house1, house2, house2, house1))

    if row := cursor.fetchone():
        return {"distance": row["distance"]}
    else:
        raise HTTPException(status_code=404, detail="Distance not found between the given houses.")













# Set phone numbers for houses from 1 to 100
@app.post("/set-phone-numbers-for-all")
def set_phone_numbers(phone_number: str, db=Depends(get_db)):
    for house_id in range(1, 101):
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO house_visits (house_id, phone_number) 
            VALUES (?, ?) 
            ON CONFLICT(house_id) 
            DO UPDATE SET phone_number=excluded.phone_number
        """, (house_id, phone_number))
        db.commit()

    return {"message": "Phone numbers set for house IDs 1 to 100."}