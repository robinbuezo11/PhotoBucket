const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.TRASLATE_REGION,
    secretAccessKey:  process.env.TRASLATE_ACCESS_KEY_ID,
    region: process.env.TRASLATE_SECRET_ACCESS_KEY
});

const translate = new AWS.Translate({apiVersion: '2017-07-01'});

async function translateText(text, targetLanguage) {
    try {
        const params = {
            SourceLanguageCode: 'auto',
            TargetLanguageCode: targetLanguage,
            Text: text
        };
        const result = await translate.translateText(params).promise();
        return result.TranslatedText;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = translateText;
