import boto3
import os
from dotenv import load_dotenv
import base64

load_dotenv()

rekognition = boto3.client('rekognition',
    aws_access_key_id=os.getenv('REKOGNITION_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('REKOGNITION_SECRET_ACCESS_KEY'),
    region_name=os.getenv('REKOGNITION_REGION')
)

def analyze_image(base64_image):
    try:
        image_bytes = base64.b64decode(base64_image)
        response = rekognition.detect_labels(
            Image={
                'Bytes': image_bytes,
            },
            MaxLabels=5,
        )

        return [label['Name'] for label in response['Labels']]
    except Exception as e:
        print(f"Ocurrió un error al procesar la imagen: {e}")
        raise e
    
def extract_text(base64_image):
    try:
        image_bytes = base64.b64decode(base64_image)
        response = rekognition.detect_text(
            Image={
                'Bytes': image_bytes,
            },
        )

        return [text['DetectedText'] for text in response['TextDetections']]
    except Exception as e:
        print(f"Ocurrió un error al procesar la imagen: {e}")
        raise e