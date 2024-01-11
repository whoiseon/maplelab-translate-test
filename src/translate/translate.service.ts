import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslateService {
  constructor(private readonly configService: ConfigService) {}

  public async translateToEN(keyword: string): Promise<string> {
    const spaceKeyword = keyword.replace(' ', '%20');
    const response = await axios.get(
      `https://api-free.deepl.com/v2/translate?auth_key=${this.configService.get(
        'DEEPL_AUTH_KEY',
      )}&text=${spaceKeyword}&target_lang=EN`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );

    console.log(response.data);

    return response.data.translations[0].text;
  }

  public async translateToKO(keyword: string): Promise<string> {
    const spaceKeyword = keyword.replace(' ', '%20');
    const response = await axios.get(
      `https://api-free.deepl.com/v2/translate?auth_key=${this.configService.get(
        'DEEPL_AUTH_KEY',
      )}&text=${spaceKeyword}&target_lang=KO`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );

    console.log(response.data);

    return response.data.translations[0].text;
  }
}
