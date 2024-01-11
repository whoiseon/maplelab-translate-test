import { Controller, Get, Query } from '@nestjs/common';
import { ItemService } from './item.service';
import { Item } from './types/item.type';

@Controller('api/item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get('')
  public async getItem(@Query('name') name: string): Promise<Item> {
    console.log(name);
    return this.itemService.getItem(name);
  }
}
