class t{constructor(t){let e={label:"Unknown data",value:"Unknown data"};"string"==typeof t?e={label:t,value:t}:Array.isArray(t)?e={label:t[0],value:t[1]}:"object"==typeof t&&("label"in t||"value"in t)&&(e=t),this.label=e.label||e.value,this.value=e.value,"userData"in e&&(this.userData=e.userData)}get length(){return this.label.length}toString(){return""+this.label}valueOf(){return this.toString()}}class e{constructor(t,i){e.all=[];const s=this;e.count=(e.count||0)+1,this.count=e.count,this.isOpened=!1,this.input=e.query(t),this.input.setAttribute("autocomplete","off"),this.input.setAttribute("aria-owns","awesomplete_list_"+this.count),this.input.setAttribute("role","combobox"),this.options=i||{},this.configure({minChars:2,maxItems:10,autoFirst:!1,data:e.DATA,filter:e.FILTER_CONTAINS,sort:!1!==i.sort&&e.SORT_BYLENGTH,container:e.CONTAINER,item:e.ITEM,replace:e.REPLACE,tabSelect:!1},i),this.index=-1,this.container=this.container(t),this.ul=e.create("ul",{hidden:"hidden",role:"listbox",id:"awesomplete_list_"+this.count,inside:this.container}),this.status=e.create("span",{className:"visually-hidden",role:"status","aria-live":"assertive","aria-atomic":!0,inside:this.container,textContent:0!==this.minChars?`Type ${this.minChars} or more characters for results.`:"Begin typing for results."}),this.events={input:{input:this.evaluate.bind(this),blur:this.close.bind(this,{reason:"blur"}),keydown(t){const e=t.keyCode;s.opened&&(13===e&&s.selected?(t.preventDefault(),t.stopImmediatePropagation(),s.select()):9===e&&s.selected&&s.tabSelect?s.select():27===e?s.close({reason:"esc"}):38!==e&&40!==e||(t.preventDefault(),s[38===e?"previous":"next"]()))}},form:{submit:this.close.bind(this,{reason:"submit"})},ul:{mousedown(t){t.preventDefault()},click(t){let e=t.target;if(e!==this){for(;e&&!/li/i.test(e.nodeName);)e=e.parentNode;e&&0===t.button&&(t.preventDefault(),s.select(e,t.target))}}}},e.bind(this.input,this.events.input),e.bind(this.input.form,this.events.form),e.bind(this.ul,this.events.ul),this.input.hasAttribute("list")?(this.list="#"+this.input.getAttribute("list"),this.input.removeAttribute("list")):this.list=this.input.getAttribute("data-list")||i.list||[],e.all.push(this)}configure(t,e){Object.keys(t).forEach(i=>{const s=t[i],a=this.input.getAttribute("data-"+i.toLowerCase());this[i]="number"==typeof s?parseInt(a,10):!1===s?null!==a:s instanceof Function?null:a,this[i]||0===this[i]||(this[i]=i in e?e[i]:s)})}set list(t){if(Array.isArray(t))this.dataList=t;else if("string"==typeof t&&t.indexOf(",")>-1)this.dataList=t.split(/\s*,\s*/);else{const i=e.query(t);if(i&&i.children){const t=[],e=e=>{if(!e.disabled){const i=e.textContent.trim(),s=e.value||i,a=e.label||i;""!==s&&t.push({label:a,value:s})}};Array.prototype.slice.apply(i.children).forEach(e),this.dataList=t}}document.activeElement===this.input&&this.evaluate()}get list(){return this.dataList}get selected(){return this.index>-1}get opened(){return this.isOpened}close(t){this.opened&&(this.ul.setAttribute("hidden",""),this.isOpened=!1,this.index=-1,this.status.setAttribute("hidden",""),e.fire(this.input,"awesomplete-close",t||{}))}open(){this.ul.removeAttribute("hidden"),this.isOpened=!0,this.status.removeAttribute("hidden"),this.autoFirst&&-1===this.index&&this.goto(0),e.fire(this.input,"awesomplete-open")}destroy(){if(e.unbind(this.input,this.events.input),e.unbind(this.input.form,this.events.form),!this.options.container){const{parentNode:t}=this.container;t.insertBefore(this.input,this.container),t.removeChild(this.container)}this.input.removeAttribute("autocomplete"),this.input.removeAttribute("aria-autocomplete");const t=e.all.indexOf(this);-1!==t&&e.all.splice(t,1)}next(){const t=this.ul.children.length;let e=0;e=this.index<t-1?this.index+1:t?0:-1,this.goto(e)}previous(){const t=this.ul.children.length,e=this.index-1;this.goto(this.selected&&-1!==e?e:t-1)}goto(t){const i=this.ul.children;if(this.selected&&i[this.index].setAttribute("aria-selected","false"),this.index=t,t>-1&&i.length>0){i[t].setAttribute("aria-selected","true"),this.status.textContent=`${i[t].textContent}, list item ${t+1} of ${i.length}`,this.input.setAttribute("aria-activedescendant",`${this.ul.id}_item_${this.index}`),this.ul.scrollTop=i[t].offsetTop-this.ul.clientHeight+i[t].clientHeight;const s=this.suggestions[this.index];e.fire(this.input,"awesomplete-highlight",{selectedIndex:this.index,selectedText:""+s,selectedSuggestion:s})}}select(t,i){let s=t;if(t?this.index=e.siblingIndex(t):s=this.ul.children[this.index],s){const t=this.index,a=this.suggestions[t];e.fire(this.input,"awesomplete-select",{selectedIndex:t,selectedText:""+a,selectedSuggestion:a,origin:i||s})&&(this.replace(a),this.close({reason:"select"}),e.fire(this.input,"awesomplete-selectcomplete",{selectedIndex:t,selectedText:""+a,selectedSuggestion:a}))}}evaluate(){const e=this,{value:i}=this.input;if(i.length>=this.minChars&&this.dataList&&this.dataList.length>0){this.index=-1,this.ul.innerHTML="";const s=s=>new t(e.data(s,i)),a=t=>e.filter(t,i);this.suggestions=this.dataList.map(s).filter(a),!1!==this.sort&&(this.suggestions=this.suggestions.sort(this.sort)),this.suggestions=this.suggestions.slice(0,this.maxItems);const n=(t,s)=>{e.ul.appendChild(e.item(t,i,s))};this.suggestions.forEach(n),0===this.ul.children.length?(this.status.textContent="No results found",this.close({reason:"nomatches"})):(this.open(),this.status.textContent=this.ul.children.length+" results found")}else this.close({reason:"nomatches"}),this.status.textContent="No results found"}static FILTER_CONTAINS(t,i){return RegExp(e.regExpEscape(i.trim()),"i").test(t)}static FILTER_STARTSWITH(t,i){return RegExp("^"+e.regExpEscape(i.trim()),"i").test(t)}static SORT_BYLENGTH(t,e){return t.length!==e.length?t.length-e.length:t<e?-1:1}static CONTAINER(t){return e.create("div",{className:"awesomplete",around:t})}static ITEM(t,i,s){const a=""===i.trim()?t:(""+t).replace(RegExp(e.regExpEscape(i.trim()),"gi"),"<mark>$&</mark>");return e.create("li",{innerHTML:a,"aria-selected":"false",id:`awesomplete_list_${this.count}_item_${s}`})}static REPLACE(t){this.input.value=t.value||t.label}static DATA(t){return t}static query(t,e){return"string"==typeof t?(e||document).querySelector(t):t||null}static queryAll(t,e){return Array.prototype.slice.call((e||document).querySelectorAll(t))}static create(t,i){const s=document.createElement(t);return Object.keys(i).forEach(t=>{const a=i[t];if("inside"===t)e.query(a).appendChild(s);else if("around"===t){const t=e.query(a);t.parentNode.insertBefore(s,t),s.appendChild(t),null!=t.getAttribute("autofocus")&&t.focus()}else t in s?s[t]=a:s.setAttribute(t,a)}),s}static bind(t,e){if(t){const i=i=>{const s=e[i];i.split(/\s+/).forEach(e=>{t.addEventListener(e,s)})};Object.keys(e).forEach(i)}}static unbind(t,e){if(t){const i=i=>{const s=e[i];i.split(/\s+/).forEach(e=>{t.removeEventListener(e,s)})};Object.keys(e).forEach(i)}}static fire(t,e,i){const s=document.createEvent("HTMLEvents"),a=t=>{s[t]=i[t]};return s.initEvent(e,!0,!0),"object"==typeof i&&Object.keys(i).forEach(a),t.dispatchEvent(s)}static regExpEscape(t){return t.replace(/[-\\^$*+?.()|[\]{}]/g,"\\$&")}static siblingIndex(t){let e=0,i=t;for(;i;)i=i.previousElementSibling,i&&(e+=1);return e}}class i extends window.HTMLElement{connectedCallback(){const t=this.dataset.searchApi;let i="Please enter your county or zip code",s="Find health plan";this.dataset.buttonLabel&&(s=this.dataset.buttonLabel),this.dataset.label&&(i=this.dataset.label);let a=function(t,e){return`<form class="form-inline form-inline-left js-cagov-lookup">\n  <div class="form-group">\n    <label for="location-query"\n      >${t}:</label\n    >\n    <div class="awesomplete">\n      <div class="awesomplete">\n        <input\n          aria-expanded="false"\n          aria-owns="awesomplete_list_1"\n          autocomplete="off"\n          class="city-search form-control"\n          data-list=""\n          data-multiple=""\n          id="location-query"\n          role="combobox"\n          type="text"\n        />\n        <ul hidden="" role="listbox" id="awesomplete_list_1"></ul>\n        <span\n          class="visually-hidden"\n          role="status"\n          aria-live="assertive"\n          aria-atomic="true"\n          >Type 2 or more characters for results.</span\n        >\n      </div>\n      <ul hidden="" id="awesomplete-list-1" role="listbox"></ul>\n      <span\n        class="visually-hidden"\n        aria-atomic="true"\n        aria-live="assertive"\n        role="status"\n        >Type 2 or more characters for results.</span\n      >\n    </div>\n    <button class="btn btn-primary" type="submit">${e}</button>\n    <div class="invalid-feedback">\n      Please enter a county or zip code in California.\n    </div>\n  </div>\n  </form>`}(i,s);this.innerHTML=a;let n=this;const o={autoFirst:!0,filter:function(t,i){return e.FILTER_CONTAINS(t,i.match(/[^,]*$/)[0])},item:function(t,i){return document.querySelector(".invalid-feedback").style.display="none",document.querySelector(".city-search").classList.remove("is-invalid"),e.ITEM(t,i.match(/[^,]*$/)[0])},replace:function(t){let e=this.input.value.match(/^.+,\s*|/)[0]+t;this.input.value=e,n.dispatchEvent(new CustomEvent("showResults",{detail:e}))}},r=new e("input[data-multiple]",o);document.querySelector("input[data-multiple]").addEventListener("keyup",e=>{const i=[13,9,27,38,40];if(e.target.value.length>=2&&-1===i.indexOf(e.keyCode)){let i=e.target.value;window.lookup=i;const s=`${t}${i}`;window.fetch(s).then(t=>t.json()).then(t=>{r.list=t.match.map(t=>t)}).catch(()=>{})}}),document.querySelector(".js-cagov-lookup").addEventListener("submit",t=>{t.preventDefault(),document.querySelector(".invalid-feedback").style.display="none",document.querySelector(".city-search").classList.remove("is-invalid");let e=this.querySelector("input").value;this.dispatchEvent(new CustomEvent("showResults",{detail:e}))})}}window.customElements.define("cwds-lookup",i);var s=[{Stage:"1",Activity:"Gas stations"},{Stage:"1",Activity:"Pharmacies"},{Stage:"1",Activity:"Grocery stores"},{Stage:"1",Activity:"Farmers markets"},{Stage:"1",Activity:"Food banks"},{Stage:"1",Activity:"Convenience stores"},{Stage:"1",Activity:"Take-out and delivery restaurants"},{Stage:"1",Activity:"Banks and credit unions"},{Stage:"1",Activity:"Laundromats and laundry services"},{Stage:"1",Activity:"State and local government offices"},{Stage:"1",Activity:"Government services"},{Stage:"1",Activity:"Police stations"},{Stage:"1",Activity:"Fire stations"},{Stage:"1",Activity:"Hospitals and urgent care"},{Stage:"1",Activity:"Doctors and dentists"},{Stage:"2a",Activity:"Retailers"},{Stage:"2a",Activity:"Shopping malls"},{Stage:"2a",Activity:"Libraries (delivery and curbside pickup only)"},{Stage:"2a",Activity:"Drive-in theaters"},{Stage:"2a",Activity:"Bookstores"},{Stage:"2a",Activity:"Jewelry stores"},{Stage:"2a",Activity:"Toy stores"},{Stage:"2a",Activity:"Clothing and shoe stores"},{Stage:"2a",Activity:"Home and furnishing stores"},{Stage:"2a",Activity:"Sporting goods stores"},{Stage:"2a",Activity:"Florists"},{Stage:"2a",Activity:"Offices"},{Stage:"2a",Activity:"Pet groomers"},{Stage:"2a",Activity:"Dog walkers"},{Stage:"2a",Activity:"Carwashes"},{Stage:"2a",Activity:"Appliance repair"},{Stage:"2a",Activity:"Residential and janitorial cleaning"},{Stage:"2a",Activity:"Places of worship"},{Stage:"2a",Activity:"Plumbing"},{Stage:"2a",Activity:"Outdoor museums"},{Stage:"2a",Activity:"Music production"},{Stage:"2a",Activity:"Film and TV production"},{Stage:"2a",Activity:"Professional sports without live audiences"},{Stage:"2b",Activity:"Dine-in restaurants"},{Stage:"2b",Activity:"Hair salons and barbershops"},{Stage:"2b",Activity:"Casinos"},{Stage:"2c",Activity:"Family entertainment centers"},{Stage:"2c",Activity:"Movie theaters"},{Stage:"2c",Activity:"Wineries"},{Stage:"2c",Activity:"Bars and restaurants with bars"},{Stage:"2c",Activity:"Zoos"},{Stage:"2c",Activity:"Museums"},{Stage:"2c",Activity:"Gyms and fitness centers"},{Stage:"2c",Activity:"Hotels and lodging for tourism and individual travel"},{Stage:"2c",Activity:"Short-term lodging rentals for tourism and individual travel"},{Stage:"2c",Activity:"Cardrooms and racetracks"},{Stage:"2c",Activity:"Campgrounds and outdoor recreation"},{Stage:"3",Activity:"Day camps"},{Stage:"3",Activity:"Schools"},{Stage:"3",Activity:"Nail salons"},{Stage:"3",Activity:"Tattoo parlors"},{Stage:"3",Activity:"Body waxing"},{Stage:"3",Activity:"Live theater"},{Stage:"3",Activity:"Saunas and steam rooms"},{Stage:"3",Activity:"Theme parks"},{Stage:"3",Activity:"Festivals"},{Stage:"3",Activity:"Higher education"},{Stage:"3",Activity:"Indoor playgrounds like bounce centers or ball pits or laser tag"},{Stage:"4",Activity:"Nightclubs"},{Stage:"4",Activity:"Concert venues"}];function a(t){let e=!1;if(t.match(/^\d+$/)){e=!0;let i="https://api.alpha.ca.gov/countyfromzip/"+t;window.fetch(i).then(t=>t.json()).then(i=>{n(i[0].county,t,e)}).catch(()=>{o()})}else n(t,t,e)}function n(t,e,i){let a;if([{name:"Modoc",stage:"2b"},{name:"Siskiyou",stage:"2b"},{name:"Del Norte",stage:"2b"},{name:"Humboldt",stage:"2b"},{name:"Trinity",stage:"2b"},{name:"Shasta",stage:"2b"},{name:"Lassen",stage:"2b"},{name:"Mendocino",stage:"2b"},{name:"Tehama",stage:"2b"},{name:"Plumas",stage:"2b"},{name:"Lake",stage:"2b"},{name:"Colusa",stage:"2b"},{name:"Glenn",stage:"2b"},{name:"Butte",stage:"2b"},{name:"Yuba",stage:"2b"},{name:"Sierra",stage:"2b"},{name:"Nevada",stage:"2b"},{name:"Alameda",stage:"2a"},{name:"Alpine",stage:"2b"},{name:"Amador",stage:"2b"},{name:"Contra Costa",stage:"2a"},{name:"Fresno",stage:"2b"},{name:"Los Angeles",stage:"2b"},{name:"Merced",stage:"2b"},{name:"San Mateo",stage:"2a"},{name:"Santa Clara",stage:"2a"},{name:"Mono",stage:"2b"},{name:"Napa",stage:"2b"},{name:"Orange",stage:"2b"},{name:"San Benito",stage:"2b"},{name:"San Diego",stage:"2b"},{name:"San Luis Obispo",stage:"2b"},{name:"Santa Barbara",stage:"2b"},{name:"Sonoma",stage:"2b"},{name:"Sutter",stage:"2b"},{name:"Tulare",stage:"2b"},{name:"Yolo",stage:"2b"},{name:"Madera",stage:"2b"},{name:"Calaveras",stage:"2b"},{name:"Mariposa",stage:"2b"},{name:"Solano",stage:"2b"},{name:"Inyo",stage:"2b"},{name:"Monterey",stage:"2b"},{name:"Stanislaus",stage:"2b"},{name:"Marin",stage:"2a"},{name:"San Joaquin",stage:"2b"},{name:"Kings",stage:"2b"},{name:"San Francisco",stage:"2a"},{name:"Imperial",stage:"2a"},{name:"Placer",stage:"2b"},{name:"Tuolumne",stage:"2b"},{name:"Ventura",stage:"2b"},{name:"Santa Cruz",stage:"2b"},{name:"Kern",stage:"2b"},{name:"San Bernardino",stage:"2b"},{name:"El Dorado",stage:"2b"},{name:"Sacramento",stage:"2b"},{name:"Riverside",stage:"2b"}].forEach(e=>{e.name.toLowerCase()===t.toLowerCase()&&(a=e)}),a){-1===t.toLowerCase().indexOf("county")&&(t+=" County");let n=` ${a.name} County`;i&&(n=`${e} is in ${a.name} County`);let o=a.stage,r=[],l=[];s.forEach(t=>{t.Stage<=o?r.push(t):l.push(t)});let c=`\n    <style>\n    @media (min-width: 570px) {\n      .open-results {\n        display: flex;\n      }\n    }\n    .open-results-set {\n      margin-right: 20px;\n    }\n    .open-results-set ul {\n      list-style: none;\n      padding: 0;\n      margin: 0;\n    }\n    .open-results-set ul li {\n      text-indent: -20px;\n      padding-left: 20px;\n    }\n    </style>\n      <h3>${n}</h3>\n      <div class="open-results">\n        <span class="open-results-set">\n          <h4>What's open:</h4>\n          <ul>\n            ${r.sort((function(t,e){return t.Activity.toUpperCase()<e.Activity.toUpperCase()?-1:1})).map(t=>`\n                <li>${t.Activity}</li>\n              `).join(" ")}\n          </ul>\n        </span>\n        <span class="open-results-set">\n          <h4>What's closed:</h4>\n          <ul>\n            ${l.sort((function(t,e){return t.Activity.toUpperCase()<e.Activity.toUpperCase()?-1:1})).map(t=>`\n                <li>${t.Activity} ${"2c"==t.Stage&&"2b"==a.stage?"(can open June 12th)":""}</li>\n              `).join(" ")}\n          </ul>\n        </span>\n      </div>\n    `;document.querySelector(".js-alameda-haircut").innerHTML=c}else o()}function o(){document.querySelector(".invalid-feedback").style.display="block"}document.querySelector("cwds-lookup")&&document.querySelector("cwds-lookup").addEventListener("showResults",t=>{a(t.detail)}),document.querySelector(".calimap")&&document.querySelector(".calimap").addEventListener("showResults",t=>{a(t.detail)});
