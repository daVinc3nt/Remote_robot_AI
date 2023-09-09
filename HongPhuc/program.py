from model import HandGestureDetectionModel
from data_processing import get_landmarks_from_images, draw_answer_to_image
import cv2
import default
import threading

class Program:
    def __init__(self, model):
        self.model = model
    
    def predict(self, frame):
        landmarks = get_landmarks_from_images(frame)
        if landmarks != None:
            prediction = self.model.predict([landmarks])
            print(default.gesture_name[prediction])

    def run(self):
        cap = cv2.VideoCapture(0)   # Initialize the webcam
        be_able_to_capture = True
        while be_able_to_capture:
            be_able_to_capture, frame = cap.read()   # Read each frame from the webcam
            frame = cv2.flip(frame, 1)               # Flip the frame vertically
            cv2.imshow("Frame", frame)
            my_thread = threading.Thread(target=self.predict, args=(frame,))
            my_thread.start()
            # Show the frame
            # Press 'Esc' to exit
            if cv2.waitKey(1) == 27:
                break
        cap.release()
        cv2.destroyAllWindows()
