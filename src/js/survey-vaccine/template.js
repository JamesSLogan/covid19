export default function (incomingPrompt) {
  let surveyUrl = `https://www.surveymonkey.com/r/MMJR7CW?source=covid&src=${randomString(32)}`;
  if (window.location.pathname == '/') {
    surveyUrl = `https://www.surveymonkey.com/r/YNZBVPZ?source=covid&src=${randomString(32)}`;
  }
  let surveyPrompt = 'Please take 5 minutes to complete our COVID-19 vaccines survey.';
  if(incomingPrompt) {
    surveyPrompt = incomingPrompt;
  }
  return `<div role="alert">
    <div class="survey">
      <div class="survey-content">
        <p class="survey-content-prompt" role="region" aria-label="${surveyPrompt}, select below">${surveyPrompt}</p>
        <a href="${surveyUrl}" target="_new" class="btn-link pt-2 pb-2 px-4 js-goto-survey" role="region" aria-label="Ok, open survey"><span aria-hidden="true">OK</span></a> 
        <button class="btn-link pt-2 pb-2 px-4 js-dismiss-survey" role="region" aria-label="Dismiss, close" data-dismiss="alert">Dismiss</button>
      </div>
    </div>
  </div>`;
}

function randomString(length) {
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}