from model import HandGestureDetectionModel
from data_processing import get_landmarks_from_images, draw_answer_to_image
import cv2
import default

class Program:
    def __init__(self, model):
        self.model = model

    def run(self):
        cap = cv2.VideoCapture(0)   # Initialize the webcam
        be_able_to_capture = True
        while be_able_to_capture:
            be_able_to_capture, frame = cap.read()   # Read each frame from the webcam
            frame = cv2.flip(frame, 1)               # Flip the frame vertically
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            landmarks = get_landmarks_from_images(frame)
            if landmarks != None:
                prediction = self.model.predict([landmarks])
                draw_answer_to_image(frame, prediction)

            # Show the frame
            cv2.imshow("Frame", frame)

            # Press 'Esc' to exit
            if cv2.waitKey(1) == 27:
                break
        cap.release()
        cv2.destroyAllWindows()
        
