import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {
    console.log('AppService');
  }

  getHello(): string {
    return 'Hello World!';
  }
}
