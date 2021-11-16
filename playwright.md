# Playwright Testing 

## Includes

We can put some test steps in separate files and reuse them in multiple places. An example is in test/includes/search.mjs:

The snippet submits the search form:
```
async function search(page) {
  await page.fill('#header-search-site', 'vaccine')
  await page.click('.header-search-button')
  await page.isVisible('#answersNow')
}
export default search;
```

An example of it being used is in test/includes.spec.mjs:
- Import the file:
```
import search from './includes/search.mjs';
```
- Call the function passing in page
```
search(page);
```

