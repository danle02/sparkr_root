var smapiKey = "nxo3vzJa"; // SMAPI-nyckeln
var userLocation = null; //Deklarerar en variabel för användarens position och nollställer den varje gång sidan laddas
var userLocationLat; // Användarens latitud
var userLocationLng; // Användarens longitud
var googleMap; // Google maps kartan
var googleKey = "AIzaSyANvWghf0VuGtg3EQCXSu9NoxS0blD-3NE"; // Google Maps API nyckel
var marker; // Kartmarkör
var directionsService; // Variabel för vägbeskrivningar
var directionsRenderer; // Variabel som ritar ut vägbeskrivningar

function init() {
    establishmentInfo = document.getElementById("establishmentInfo");
    establishmentInfo.style.display = "none";
    getUserLocation();
}

window.addEventListener("load", init);

function getUserLocation() { // Funktion för att få användarens geografiska position
    if (navigator.geolocation) { // Kontrollerar om webbläsaren stödjer geolocation-API:t
        navigator.geolocation.getCurrentPosition(function (position) { //Om webbläsaren stödjer API:t sparar den den geografiska platsen i userLocation
            userLocation = position.coords; // Användarens koordinater
            userLocationLat = position.coords.latitude;
            userLocationLng = position.coords.longitude;
            // userLocationLat = "56.878017011624685";
            // userLocationLng = "14.807412906905228";
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
    request.open("GET", "https://smapi.lnu.se/api?api_key=" + smapiKey + "&controller=establishment&descriptions=nattklubb&method=getfromlatlng&lat=" + userLocationLat + "&lng=" + userLocationLng + "&radius=10&debug=true", true)
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4)
            if (request.status == 200) getData(request.responseText);
            else establishmentInfo.innerHTML = "<p>Den begärda resursen hittades inte.<p>"
    };
}

function getData(responseText) {
    let establishmentData = JSON.parse(responseText);
    console.log(responseText);

    if (establishmentData.payload == null || establishmentData.payload.length === 0) {
        alert("Det fanns inga nattklubbar i din närhet tyvärr.");
        return;
    }
    else {
        establishmentInfo.style.display = "block";
        let establishments = establishmentData.payload;
        establishments.sort(() => Math.random() - 0.5); // Slumpar nattklubb efter innehåll i payload

        let establishment = establishments[0];
        let lat = establishment.lat;
        let lng = establishment.lng;
        let estName = establishment.name;
        let estDescription = establishment.description;
        let estTel = establishment.phone_number;
        let estAddress = establishment.address;
        let estPriceRange = establishment.price_range;
        let estWebsite = establishment.website;
        let estRating = Number(establishment.rating).toFixed(1);

        // Utskrift av information i HTML
        document.getElementById("establishmentName").innerHTML = estName;
        document.getElementById("establishmentDescription").innerHTML = estDescription;
        let clickableTelNr = document.createElement("a");
        clickableTelNr.setAttribute("href", "tel: " + estTel);
        let telIcon = document.createElement("img");
        telIcon.setAttribute("src", "../img/phone.png");
        clickableTelNr.appendChild(telIcon);
        // clickableTelNr.textContent = estTel;
        let clickableWWW = document.createElement("a");
        clickableWWW.setAttribute("href", estWebsite);
        let linkIcon = document.createElement("img");
        linkIcon.setAttribute("src", "../img/otherclick.png")
        clickableWWW.appendChild(linkIcon);
        // clickableWWW.textContent = estWebsite;
        document.getElementById("establishmentWebsite").appendChild(clickableWWW);
        // document.getElementById("establishmentTel").innerHTML = "";
        document.getElementById("establishmentTel").appendChild(clickableTelNr);
        document.getElementById("establishmentAddress").innerHTML = "Adress: " + estAddress;
        document.getElementById("establishmentPriceRng").innerHTML = "Pris: " + estPriceRange + " kr";
        document.getElementById("establishmentRating").innerHTML = "Omdöme: " + parseFloat(estRating) + " / 5";

        displayMap(lat, lng);
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
