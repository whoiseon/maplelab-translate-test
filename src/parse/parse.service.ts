import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { Item } from '../item/types/item.type';

@Injectable()
export class ParseService {
  constructor() {}

  public async getHtml(url: string, selector: string): Promise<string> {
    try {
      return '123';
    } catch (e) {
      console.error(e);
    }
  }

  public async getData(selector: string, page: Page): Promise<string> {
    try {
      return await page.evaluate(selector => {
        const element = document.querySelector(selector);
        if (element) return element.innerHTML;
        return '';
      }, selector);
    } catch (e) {
      console.error(e);
    }
  }

  public async getImage(
    selector: string,
    attribute: 'src' | 'alt',
    page: Page,
  ): Promise<string> {
    try {
      return await page.evaluate(
        (selector, attribute) => {
          const element = document.querySelector(selector);
          if (element) return element.getAttribute(attribute);
          return '';
        },
        selector,
        attribute,
      );
    } catch (e) {
      console.error(e);
    }
  }

  public translateJob(job: string): string {
    switch (job) {
      case 'warrior':
        return '전사';
      case 'magician':
        return '마법사';
      case 'bowman':
        return '궁수';
      case 'thief':
        return '도적';
      case 'pirate':
        return '해적';
      default:
        return '';
    }
  }

  public replaceSpaceToPlus(keyword: string): string {
    return keyword.replace(/ /gi, '+');
  }
}
