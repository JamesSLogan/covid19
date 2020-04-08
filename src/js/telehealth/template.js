export default function template(inputval) {
  // make API call for results based on zip or county string
  let isZip = false;
  if (inputval.match(/^\d+$/)) {
    // we are dealing with a zip code
    isZip = true;
    let url = `https://api.alpha.ca.gov/countyfromzip/${inputval}`;
    window.fetch(url)
      .then(response => {
        return response.json();
      })
      .then(myzip => {
        lookupSuccess(myzip.county, inputval, isZip);
      })
      .catch(() => {
        lookupFail();
      });
  } else {
    lookupSuccess(inputval, inputval, isZip);
  }
}

function lookupSuccess(inputCounty, inputval, isZip) {
  if(inputCounty.toLowerCase().indexOf('county') === -1) {
    inputCounty += ' County';
  }
  let resultDescription = `Providers in ${inputCounty}`;
  if(isZip) {
    resultDescription = `${inputval} is in ${inputCounty}, showing providers in ${inputCounty}`
  }
  window.fetch('https://api.alpha.ca.gov/TeleHealth/'+inputCounty)
  .then(response => {
    return response.json();
  })
  .then(telehealth => {
    document.querySelector('.js-telehealth-providers').innerHTML = `
      <h3>${resultDescription}</h3>
      <div class="pt-5 js-provider-list">
        ${telehealth.telehealthList.map( (item) => {
          return `
            <div class="card">
              <div class="card-header card-header-multi">
                <span class="bold">${ item['Health Plan Name'] }</span>
                <span class="">${ item['Plan Type'] }</span>
              </div>
              <div class="card-body">
                <p class="card-text">
                  <p>Online medical care offered: ${(item['Health Plan Offered Telehealth'] == 'Yes') ? '<span class="bold">Yes</span>' : '<span class="bold">No</span>' }
                  ${ (item['Telehealth Services Phone Number'] != '') ? `<p>Telehealth services phone number: <a href="tel:${ item['Telehealth Services Phone Number'] }">${ item['Telehealth Services Phone Number'] }</a></p>` : '' }                
                  ${ (item['Health Plan Nurse Advice Line'] != '') ? `<p>Health plan nurse advice line: <a href="${ item['Health Plan Nurse Advice Line'] }">${ item['Health Plan Nurse Advice Line'] }</a></p>` : ''}
                  ${ item['Special Note'] }
                </p>
                ${ (item['Telehealth Website Website'] != '') ? `<a href="${ item['Telehealth Website Website'] }" class="action-link mr-3">Visit Telehealth website</a>` : ''}
              </div>
            </div>
          `
        }).join(' ')}
      </div>
    `    
  })
  .catch((err) => {
    lookupFail();
  });
}

function lookupFail () {
  document.querySelector('.invalid-feedback').style.display = 'block';
}
