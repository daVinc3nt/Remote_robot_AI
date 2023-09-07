import cv2
import numpy as np
import mediapipe as mp
import csv
import default

class DataProcessing:
    def __init__(self):
        self.gesture_name = []
        self.dict = {
        #   gesture_name : index
        }
        self.set_gesture_name(default.gesture_name)

        self.folder_name = {
            # Folder name            : [Number of images, Label]
        }
        self.x_train = []
        self.y_train = []
        self.val_x_train = []
        self.val_y_train = []

    def convert_index_to_image_filename(self, index):
        # (1).jpg, (2).jpg, (3).jpg, ...
        return '(' + str(index) + ').jpg'

    # Read images from folder
    def read_images_from_folder(self, folder_path, number_of_images, value):
        val_index = number_of_images - number_of_images * default.validation_percentage // 100
        for i in range(1, number_of_images + 1):
            print("Reading " + folder_path + '/' + self.convert_index_to_image_filename(i) + "...")
            image = cv2.imread(folder_path + '/' + self.convert_index_to_image_filename(i))
            landmarks = get_landmarks_from_images(image)
            if(landmarks != None):
                if i <= val_index:
                    self.x_train.append(landmarks)
                    self.y_train.append(value)
                else:
                    self.val_x_train.append(landmarks)
                    self.val_y_train.append(value)

    def create_dataset(self):
        for folder in self.folder_name:
            print("Reading " + folder + "...")
            self.read_images_from_folder(folder, self.folder_name[folder][0], self.dict[self.folder_name[folder][1]])   
            print("Reading " + folder + " completed!")
        print("Reading completed!")

    def write_dataset(self, filename, val_filename):
        with open(filename, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["x_train", "y_train"])
            for i in range(len(self.x_train)):
                writer.writerow([self.x_train[i], self.y_train[i]])
        with open(val_filename, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["x_train", "y_train"])
            for i in range(len(self.val_x_train)):
                writer.writerow([self.val_x_train[i], self.val_y_train[i]])
        print("Writing completed!")
    
    def change_folder_name(self, folder_name):
        self.folder_name = folder_name

    def add_folder_name(self, folder_name, number_of_images, label):
        self.folder_name[folder_name] = [number_of_images, label]

    def set_gesture_name(self, gesture_name):
        self.gesture_name = gesture_name
        for i in range(len(self.gesture_name)):
            self.dict[self.gesture_name[i]] = i

mpHands = mp.solutions.hands
hands = mpHands.Hands(max_num_hands=2, min_detection_confidence=0.6)

# Get lankmark function
def get_landmarks_from_images(image):   
    # Convert image to RGB
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    # Get result from mediapipe
    result = hands.process(image)
    # Check if hand(s) exist
    if result.multi_hand_landmarks:
        # Get landmark of each hand
        for hand_landmarks in result.multi_hand_landmarks:
            # Get landmark coordinate
            landmark_list = []
            for id, landmark in enumerate(hand_landmarks.landmark):
                # Get landmark coordinate
                h, w, c = image.shape
                cx, cy = int(landmark.x * w), int(landmark.y * h)
                landmark_list.append(cx)
                landmark_list.append(cy)
            return landmark_list
    return None

# Draw answer to image
def draw_answer_to_image(image, answer):
    cv2.putText(image, default.gesture_name[answer], (10, 70), cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 255), 3)