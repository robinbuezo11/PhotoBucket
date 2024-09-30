import boto3
import os
from dotenv import load_dotenv

load_dotenv()

rekognition = boto3.client('rekognition',
    aws_access_key_id=os.getenv('REKOGNITION_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('REKOGNITION_SECRET_ACCESS_KEY'),
    region_name=os.getenv('REKOGNITION_REGION_NAME')
)

def compare_images(image_url, image_url2):
    try:
        image_name = image_url.split('/').pop()
        image_name2 = image_url2.split('/').pop()

        params = {
            'SimilarityThreshold': 80,
            'SourceImage': {
                'S3Object': {
                    'Bucket': os.getenv('AWS_BUCKET_NAME'),
                    'Name': image_name,
                }
            },
            'TargetImage': {
                'S3Object': {
                    'Bucket': os.getenv('AWS_BUCKET_NAME'),
                    'Name': image_name2,
                }
            }
        }

        result = rekognition.compare_faces(**params)
        return result
    
    except Exception as e:
        print(f"Error al comparar las imágenes: {e}")
        raise e