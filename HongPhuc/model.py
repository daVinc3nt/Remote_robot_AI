import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten
import csv

class HandGestureDetectionModel:
    def __init__(self):
        # Default model
        self.model_file_name = None
        self.model = Sequential()
        self.model.compile(optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy'])
        self.x_train = np.array([])
        self.y_train = np.array([])
        self.val_x_train = np.array([])
        self.val_y_train = np.array([])
        self.normalized = False

    # Load model from file
    def load_model(self, filename):
        self.model_file_name = filename
        self.model = tf.keras.models.load_model(filename)

    # Change model
    def change_model(self, model):
        self.model = model
    
    # Show summary of model
    def show_summary(self):
        self.model.summary()

    # Save model
    def save_model(self, filename):
        self.model.save(filename)

    # Set optimizer, loss function for model
    def set_optimizer_loss(self, optimizer, loss):
        self.model.compile(optimizer=optimizer, loss=loss, metrics=['accuracy'])

    # Train model
    def train_model(self, epochs):
        if not self.normalized:
            self.x_train = tf.keras.utils.normalize(self.x_train, axis=1)
            self.normalized = True
        self.model.fit(self.x_train, self.y_train, epochs=epochs, validation_data=(self.val_x_train, self.val_y_train))

    # Predict gesture
    def predict(self, landmarks):
        prediction = self.model.predict(landmarks)
        return np.argmax(prediction[0])
    
    # Read data from csv file
    def read_data_from_csv(self, filename, val_filename=None):
        x = []
        y = []
        val_x = []
        val_y = []
        with open(filename, 'r') as file:
            reader = csv.reader(file)
            first_line = True
            for row in reader:
                if first_line == True:
                    first_line = False
                else:
                    x.append(list(map(int, row[0].strip('][').split(', '))))    # Convert string list to list
                    y.append(int(row[1]))
        if val_filename != None:
            with open(val_filename, 'r') as file:
                reader = csv.reader(file)
                first_line = True
                for row in reader:
                    if first_line == True:
                        first_line = False
                    else:
                        val_x.append(list(map(int, row[0].strip('][').split(', '))))
                        val_y.append(int(row[1]))
            self.val_x_train = np.array(val_x, dtype='int32')
            self.val_y_train = np.array(val_y, dtype='int32')            

        self.x_train = np.array(x, dtype='int32')
        self.y_train = np.array(y, dtype='int32')
        self.normalized = False


