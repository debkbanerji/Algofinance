import { Page } from './app.po';

describe('algofinance App', () => {
  let page: Page;

  beforeEach(() => {
    page = new Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
