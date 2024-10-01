import boto3
import os
from dotenv import load_dotenv

load_dotenv()

rekognition = boto3.client('rekognition',
    aws_access_key_id=os.getenv('REKOGNITION_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('REKOGNITION_SECRET_ACCESS_KEY'),
    region_name=os.getenv('REKOGNITION_REGION')
)

def compare_images(image_url, image_url2):
    try:
        image_name = image_url.split('/').pop()
        image_name2 = image_url2.split('/').pop()

        image_nameI1 = 'Fotos_Reconocimiento_Facial/' + image_name
        image_nameI2 = 'Fotos_Reconocimiento_Facial/' + image_name2

        params = {
            'SimilarityThreshold': 80,
            'SourceImage': {
                'S3Object': {
                    'Bucket': os.getenv('AWS_BUCKET_NAME'),
                    'Name': image_nameI1,
                }
            },
            'TargetImage': {
                'S3Object': {
                    'Bucket': os.getenv('AWS_BUCKET_NAME'),
                    'Name': image_nameI2,
                }
            }
        }

        result = rekognition.compare_faces(**params).get('FaceMatches', [])
        print(f"Result: {result}")
        return result
    
    except Exception as e:
        print(f"Error al comparar las imágenes: {e}")
        raise e