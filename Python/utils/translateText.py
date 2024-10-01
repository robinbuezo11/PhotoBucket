import boto3
import os
from dotenv import load_dotenv

load_dotenv()

translate = boto3.client('translate',
    aws_access_key_id=os.getenv('TRASLATE_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('TRASLATE_SECRET_ACCESS_KEY'),
    region_name=os.getenv('TRASLATE_REGION')
)

def translate_text(text, target_language):
    try:
        params = {
            'SourceLanguageCode': 'auto',
            'TargetLanguageCode': target_language,
            'Text': text
        }

        result = translate.translate_text(**params)
        return result.get('TranslatedText')
    
    except Exception as e:
        print(f"Error al traducir el texto: {e}")
        raise e