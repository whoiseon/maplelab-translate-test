import { Injectable } from '@nestjs/common';
import { ParseService } from '../parse/parse.service';
import puppeteer from 'puppeteer';
import { Item } from './types/item.type';
import { TranslateService } from '../translate/translate.service';

@Injectable()
export class ItemService {
  constructor(
    private readonly parseService: ParseService,
    private readonly translateService: TranslateService,
  ) {}

  public async getItem(itemName: string): Promise<Item> {
    // DB에 데이터가 있으면 그냥 불러온다.

    // 없으면 크롤링 후 번역해서 DB에 저장하고 뿌려준다.
    let testTranslateItemName = '';

    if (itemName === '뇌전 수리검') {
      // 표창
      testTranslateItemName = 'Steely+Throwing-Knives';
    } else if (itemName.includes('주문서')) {
      // 주문서
      const itemNameSplit = itemName.split(' ');
      const baseName = 'Scroll for';
      const itemCategory = await this.translateService.translateToEN(
        itemNameSplit[0],
      );
      // 아래꺼 안해도 % -> %25 로 바꿔주는 확인
      const percentage = itemNameSplit[itemNameSplit.length - 1].replace(
        '%',
        '%25',
      );
      let stat = itemNameSplit[1];
      if (stat === '공격력') {
        stat = 'ATT';
      } else if (stat === '마력') {
        stat = 'Magic Att.';
      }

      testTranslateItemName = `${baseName} ${itemCategory} for ${stat} ${percentage}`;
      console.log(testTranslateItemName);
    } else {
      testTranslateItemName =
        await this.translateService.translateToEN(itemName);
    }

    const item = await this.getItemParse(testTranslateItemName, itemName);

    return item;
  }

  public async getItemParse(itemName: string, koName: string): Promise<Item> {
    const url = `https://osmlib.com/?search=${itemName}`;
    const itemKoreanName = koName.replace('+', ' ');

    const browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();
    await page.goto(url);
    try {
      await page.waitForSelector('table.item-table', { timeout: 1000 });
    } catch (e) {
      await browser.close();
      return null;
    }

    const image = await this.parseService.getImage(
      'table tbody tr:nth-child(1) img',
      'src',
      page,
    );

    const title = await this.parseService.getData(
      'table tbody tr:nth-child(1) td:nth-child(1) .item-title',
      page,
    );

    let description = await this.parseService.getData(
      'table tbody tr:nth-child(1) td:nth-child(1) .item-description',
      page,
    );

    const statParse = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'table tbody tr:nth-child(1) td:nth-child(1) div.labels',
      );

      const statArray = [];
      elements.forEach(element => {
        const htmlString = element.innerHTML;
        statArray.push(htmlString);
      });

      return statArray;
    });

    if (description) {
      description = await this.translateService.translateToKO(description);
    }

    const stat = this.getItemStat(
      statParse,
      image,
      itemKoreanName,
      description,
    );

    await browser.close();
    return stat;
  }

  private getItemStat(
    statString: string[],
    image: string,
    title: string,
    description: string,
  ): Item {
    const newItem = {
      image,
      title,
      description,
      job: null,
      weaponAttack: null,
      magicAttack: null,
      effects: null,
      requiredLevel: null,
      requiredStats: null,
      upgradeSlots: null,
      sellPrice: null,
      equipGroup: null,
      category: null,
      subCategory: null,
      overallCategory: null,
    };

    statString.forEach(statString => {
      const stat = statString.toLowerCase();
      const regex = '<div class="detail">([\\s\\S]*?)</div>';
      const effectRegex: RegExp = /\+?(\d+)\s?\(\s?(\d+)-(\d+)\s?\)/;

      if (stat.includes('job')) {
        newItem.job = this.parseService.translateJob(stat.match(regex)[1]);
      }

      if (stat.includes('weapon attack')) {
        const weaponAttack = stat.match(regex)[1];
        const match = weaponAttack.match(effectRegex);

        if (match) {
          const [, defaultValue, min, max] = match;
          newItem.weaponAttack = `${defaultValue},${min},${max}`;
        }
      }

      if (stat.includes('magic attack')) {
        const magicAttack = stat.match(regex)[1];
        const match = magicAttack.match(effectRegex);

        if (match) {
          const [, defaultValue, min, max] = match;
          newItem.magicAttack = `${defaultValue},${min},${max}`;
        }
      }

      if (stat.includes('effects')) {
        const effect = stat.match(regex)[1];
        const effectArray = effect.trim().split('\n');
        const effectStringArray: string[] = [];

        effectArray.forEach(effect => {
          const match = effect.match(/(\w+)\s+\+(\d+)\s+\((\d+)-(\d+)\)/);
          if (match) {
            const [, key, defaultValue, min, max] = match;
            effectStringArray.push(`${key},${defaultValue},${min},${max}`);
          }
        });

        newItem.effects = effectStringArray.join(';');
      }

      if (stat.includes('required level')) {
        const requiredLevel = stat.match(regex)[1];
        newItem.requiredLevel = Number(requiredLevel);
      }

      if (stat.includes('required stats')) {
        const requiredStats = stat.match(regex)[1];
        const requiredStatsArray = requiredStats.trim().split('\n');
        const requiredStatsStringArray: string[] = [];

        requiredStatsArray.forEach(requiredStats => {
          const match = requiredStats.match(/(\w+)\s+(\d+)/);
          if (match) {
            const [, key, value] = match;
            requiredStatsStringArray.push(`${key},${value}`);
          }
        });

        newItem.requiredStats = requiredStatsStringArray.join(';');
      }

      if (stat.includes('upgrade slots')) {
        const upgradeSlots = stat.match(regex)[1];
        newItem.upgradeSlots = Number(upgradeSlots);
      }

      if (stat.includes('sells for')) {
        const sellPrice = stat.match(regex)[1];
        const stringWithoutImgTag = sellPrice.replace(/<img[^>]*>/g, '');
        const stringWithoutComma = stringWithoutImgTag.replace(/,/g, '');

        newItem.sellPrice = Number(stringWithoutComma);
      }

      if (stat.includes('equip group')) {
        newItem.equipGroup = stat.match(regex)[1];
      }

      if (stat.includes('category')) {
        newItem.category = stat.match(regex)[1];
      }

      if (stat.includes('sub category')) {
        newItem.subCategory = stat.match(regex)[1];
      }

      if (stat.includes('overall category')) {
        newItem.overallCategory = stat.match(regex)[1];
      }
    });

    return newItem;
  }
}
