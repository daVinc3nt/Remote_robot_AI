from default import model_filename
from model import HandGestureDetectionModel
from program import Program

# Create model
model = HandGestureDetectionModel()
model.load_model(model_filename)

my_program = Program(model)
my_program.run()
