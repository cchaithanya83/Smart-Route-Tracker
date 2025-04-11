import matplotlib.pyplot as plt
import numpy as np

# Data
models = ['Decision Tree', 'SVR', 'KNN', 'Random Forest']
mae = [2.336760, 2.053695, 1.912020, 1.622762]
mse = [8.524010, 6.646207, 5.760314, 4.109545]
r2 = [0.296155, 0.452890, 0.525816, 0.620613]
accuracy = [0.638630, 0.749452, 0.741507, 0.765890]
f1_score = [0.642243, 0.671677, 0.704846, 0.726973]

# X-axis positions (e.g., model indices)
x = np.arange(len(models))

# Plotting
plt.figure(figsize=(10, 6))
plt.plot(x, mae, marker='o', label='MAE', color='blue')
plt.plot(x, mse, marker='o', label='MSE', color='orange')
plt.plot(x, r2, marker='o', label='R² Score', color='green')
plt.plot(x, accuracy, marker='o', label='Accuracy', color='red')
plt.plot(x, f1_score, marker='o', label='F1 Score', color='purple')

# Adding labels and title
plt.xlabel('Models', fontsize=12)
plt.ylabel('Metrics', fontsize=12)
plt.title('Comparison of Model Performance Metrics', fontsize=14)

# Customizing X-axis ticks
plt.xticks(x, models)

# Adding grid
plt.grid(True, linestyle='--', alpha=0.6)

# Adding legend
plt.legend()

# Display the graph
plt.tight_layout()
plt.show()
