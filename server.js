const express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var request = require('request-promise');
var path = require('path');
var fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const app = express();
const googleMapsClient = require('@google/maps').createClient({
	key: 'AIzaSyAZaFHUnNYraowWTpa9d73lX02iwp_aLJ0'
});
app.use("/imgs", express.static('./imgs'));
var urlencodedParser = bodyParser.urlencoded ({ extended: false});
var main= fs.readFileSync('./index.html');
var mapFile = fs.readFileSync('./map.html');
var mapHTML = new JSDOM(mapFile.toString());
var mainHTML = new JSDOM(main.toString());
var service;
var map;
var chicago;
var directionsService;
var directionsRender;
function initMap() { 
	map = new googleMapsClient.maps.Map(mapHTML.window.document.getElementById('map'), { center: {lat: -34.397, lng: 150.644}, zoom: 8 }); 
	directionsService = new googleMapsClient.maps.DirectionsService();
	directionsRenderer = new googleMapsClient.maps.DirectionsRenderer();
	chicago = new googleMapsClient.maps.LatLng(41.850033, -87.6500523);
	var mapOptions = {
	zoom:7,
	center: chicago
	}
	directionsRenderer.setMap(map);
}
function getLocation(location, distance) {
	var request = {
		input: location,
		inputtype: 'textquery',
		language: 'en',
		fields: ['name', 'geometry'],
	};

	googleMapsClient.findPlace(request, (results, status) => {
		if (status === googleMapsClient.maps.places.PlacesServiceStatus.OK) {
			var locationCoords = results[0].geometry.location;
			map.setCenter(locationCoords);
			console.log(locationCoords.lat());
			const offsetLng = locationCoords.lng()+(dist/2* 0.85)/(69.04* Math.cos(locationCoords.lat() * Math.PI / 180))
			var walk = new googleMapsClient.maps.LatLng(locationCoords.lat(), offsetLng);
			console.log(walk.lat()+ " " + walk.lng()); 
			var waypts = [];
			waypts.push({
				location: walk,
				stopover: false
			});
			var req = {
				origin: locationCoords,
				destination: locationCoords,
				waypoints: waypts,
				travelMode: 'WALKING'
			};
			googleMapsClient.directions(req);
		}
	});
}
app.post('/', urlencodedParser, (req, res) => {
	console.log(req.body);
	getLocation(req.body.location, req.body.distance);
	res.status(204).send();

});
app.get('/', (req, res) => {
	console.log("getting data");
	res.end(mainHTML.serialize());
});
	

const server = app.listen(process.env.PORT || 3001, () => {
	console.log('Server is running at 3001');
});
