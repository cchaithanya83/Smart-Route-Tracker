import pandas as pd
import numpy as np

distance_matrix = pd.read_csv('distance_matrix.csv')

matrix = distance_matrix.to_numpy()
print(matrix)