# To change some model, or using another dataset, change this file and run it.
from data_processing import DataProcessing
from model import HandGestureDetectionModel
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten
import default

# Create data
data = DataProcessing()
folder_name = {
    'train_val_four'         : [1805, 'forward'],           # 1805 is the number of images in this folder
    'train_val_mute'         : [1811, 'left'],
    'train_val_one'          : [1778, 'left'],
    'train_val_ok'           : [1750, 'backward'],
    'train_val_three'        : [1751, 'right'],
    'train_val_three2'       : [1737, 'right'],
    'train_val_stop'         : [1748, 'stop'],
    'train_val_stop_inverted': [1803, 'stop']
}
data.change_folder_name(folder_name)
data.create_dataset()
data.write_dataset(default.csv_filename)

# Create model
model = HandGestureDetectionModel()
model.read_data_from_csv(default.csv_filename)
my_model = Sequential([
        Flatten(input_shape=(42, )),
        Dense(64, activation='relu'),
        Dense(128, activation='relu'),
        Dense(512, activation='relu'),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(5, activation='softmax')
])
model.change_model(my_model)
model.set_optimizer_loss('adam', 'sparse_categorical_crossentropy')
model.train_model(50)
model.save_model('my_model')