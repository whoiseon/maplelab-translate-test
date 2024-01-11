import { Module } from '@nestjs/common';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { ParseService } from '../parse/parse.service';
import { TranslateService } from '../translate/translate.service';

@Module({
  controllers: [ItemController],
  providers: [ItemService, ParseService, TranslateService],
})
export class ItemModule {}
