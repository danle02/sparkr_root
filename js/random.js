var smapiKey = "nxo3vzJa"; // SMAPI-nyckeln
var userLocation = null; //Deklarerar en variabel för användarens position och nollställer den varje gång sidan laddas
var userLocationLat; // Användarens latitud
var userLocationLng; // Användarens longitud
var googleMap; // Google maps kartan
var googleKey = "AIzaSyANvWghf0VuGtg3EQCXSu9NoxS0blD-3NE"; // Google Maps API nyckel
var marker; // Kartmarkör
var directionsService; // Variabel för vägbeskrivningar
var directionsRenderer; // Variabel som ritar ut vägbeskrivningar
var frontPageDiv; // Referens för innehållet på förstasidan
var randomInfo; // Referens för slumpa åt mig resultatet
var undoBtn; // Referens för knapp som ångrar slumpa åt mig resultatet

function init() {
  let randomBtn = document.getElementById("randomBtn").addEventListener("click", getUserLocation);
  frontPageDiv = document.getElementById("frontPageDiv");
  randomInfo = document.getElementById("randomInfo");
  randomInfo.style.display = "none";
  undoBtn = document.getElementById("undoBtn");
}

window.addEventListener("load", init);

function getUserLocation() { // Funktion för att få användarens geografiska position
  if (navigator.geolocation) { // Kontrollerar om webbläsaren stödjer geolocation-API:t
    navigator.geolocation.getCurrentPosition(function (position) { //Om webbläsaren stödjer API:t sparar den den geografiska platsen i userLocation
      userLocation = position.coords; // Användarens koordinater
      userLocationLat = position.coords.latitude;
      userLocationLng = position.coords.longitude;
      //  userLocationLat = "56.878017011624685";
      //  userLocationLng = "14.807412906905228";
      requestSmapi();
    }, function (error) { // Funktion som anropas om det har blivit ett fel i hämtningen av geo-platsen
      console.log(error);
    });
  } else {
    console.log("Platstjänster stöds inte av din webbläsare."); // Om webbläsaren inte stödjer geolocation api:t
  }
}

function requestSmapi() {
  let request = new XMLHttpRequest();
  request.open("GET", "https://smapi.lnu.se/api?api_key=" + smapiKey + "&controller=establishment&method=getfromlatlng&lat=" + userLocationLat + "&lng=" + userLocationLng + "&radius=100&debug=true", true)
  request.send(null);
  console.log(userLocationLat);
  request.onreadystatechange = function () {
    if (request.readyState == 4)
      if (request.status == 200) getData(request.responseText);
      else randomInfo.innerHTML = "<p>Den begärda resursen hittades inte.</p>"
  };
}

function getData(responseText) {
  let randomData = JSON.parse(responseText);
  if (randomData.payload == null || randomData.payload.length === 0) {
    alert("Det hittades inga resultat i din närhet.");
    return;
  }

  else {
    frontPageDiv.style.display = "none";
    randomData.payload.sort(() => Math.random() - 0.5);
    randomInfo.style.display = "block";

    let lat = randomData.payload[0].lat;
    let lng = randomData.payload[0].lng;
    let randomCity = randomData.payload[0].city;
    let randomName = randomData.payload[0].name;
    let randomDescription = randomData.payload[0].description;
    let randomTel = randomData.payload[0].phone_number;
    let randomAddress = randomData.payload[0].address;
    let randomPriceRange = randomData.payload[0].price_range;
    let randomWebsite = randomData.payload[0].website;
    let randomRating = Number(randomData.payload[0].rating).toFixed(1);

     // Utskrift av information i HTML
    document.getElementById("randomName").innerHTML = randomName;
    document.getElementById("randomDescription").innerHTML = randomDescription;
    let clickableTelNr = document.createElement("a");
    clickableTelNr.setAttribute("href", "tel: " + randomTel);

    if (!randomData.phone_number) {
        document.getElementById("randomTel").innerHTML = "Telefonnummer: Inget telefonnummer hittades."
    } else {
        document.getElementById("randomTel").innerHTML = "";
        document.getElementById("randomTel").appendChild(clickableTelNr);
        let telIcon = document.createElement("img");
        telIcon.setAttribute("src", "../img/phone.png");
        clickableTelNr.appendChild(telIcon);
    }

    if (randomData.outdoors == "Y") {
        document.getElementById("randomOutdoors").innerHTML = "Utomhusaktivitet: Ja"
    }
    else {
        document.getElementById("randomOutdoors").innerHTML = "Utomhusaktivitet: Nej"
    }
    let clickableWWW = document.createElement("a");
    clickableWWW.setAttribute("href", randomWebsite);
    let linkIcon = document.createElement("img");
    linkIcon.setAttribute("src", "../img/otherclick.png")
    clickableWWW.appendChild(linkIcon);
    // clickableWWW.textContent = activitiesDataWebsite;
    document.getElementById("randomWebsite").innerHTML = "";
    document.getElementById("randomWebsite").appendChild(clickableWWW);
    document.getElementById("randomCity").innerHTML = "Stad: " + randomCity;
    document.getElementById("randomAddress").innerHTML = "Adress:" + randomAddress;
    document.getElementById("randomPriceRng").innerHTML = "Pris: " + randomPriceRange;
    document.getElementById("randomRating").innerHTML = "Omdöme:" + randomRating + " / 5";
    document.getElementById("randomAddress").innerHTML = "Adress: " + randomAddress;
    document.getElementById("randomPriceRng").innerHTML = "Pris: " + randomPriceRange + " kr";
    document.getElementById("randomRating").innerHTML = "Omdöme: " + randomRating + " / 5";

    displayMap(lat, lng);
    undoBtn.addEventListener("click", undoResults);
    document.getElementById("directions-btn").addEventListener("click", function () {
        getDirections(userLocationLat, userLocationLng);
    });

  }
}

function displayMap(lat, lng) {
  // Skapa nytt kartobjekt
  map = new google.maps.Map(document.getElementById("googleMap"), {
    center: { lat: parseFloat(lat), lng: parseFloat(lng) },
    zoom: 15,
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },  // No points of interest.
      { featureType: "transit.station", stylers: [{ visibility: "off" }] }  // No bus stations, etc.
    ],
    mapTypeControl: false
  });
  // Lägger till markör
  marker = new google.maps.Marker({
    position: { lat: parseFloat(lat), lng: parseFloat(lng) },
    map: map
  });

  // Skapar ny instans av vägbeskrivningar och en instans som renderar vägbeskrivningen
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map
  });

}

function getDirections(userLocationLat, userLocationLng) {
  let myLocation = new google.maps.LatLng(parseFloat(userLocationLat), parseFloat(userLocationLng));
  let destination = new google.maps.LatLng(marker.getPosition().lat(), marker.getPosition().lng());
  let requestDirections = {
    origin: myLocation,
    destination: destination,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(requestDirections, function (result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      // Tar bort den tidigare markören (så att det inte blir dubbla markörer på destinationen)
      if (marker) {
        marker.setMap(null);
      }
      // Visar vägbeskrivningarna på kartan
      directionsRenderer.setDirections(result);
      directionsRenderer.setMap(map);
    }
  });
}

function undoResults() {
  randomInfo.style.display = "none";
  frontPageDiv.style.display = "block";
}