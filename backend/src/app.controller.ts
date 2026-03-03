import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller("")
export class AppController {
  constructor(private readonly appService: AppService) { }


  @Get()
  getHello(): string {
    return "<h1>Hello<h1>";
  }  

  @Get("tonconnect-manifest.json")
  getTonconnectManifest() {
    // return {
    //   "url": "https://tem4ik.ru/",    
    //   "name": "Shark Gifts",
    //   "iconUrl": "https://tem4ik.ru/assets/logo.png"
      
    // }

    return {
      "url": "https://q3mzcghw-8080.euw.devtunnels.ms/",    
      "name": "Shark Gifts",
      "iconUrl": "https://i.ibb.co/qYQZKXWZ/IMG-624895.png"
      
    }
  }
  

  
}

