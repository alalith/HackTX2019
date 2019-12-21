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
	key: 'AIzaSyCvHT2yfFAaFsifg5nvyYQe9QwRLtB7JPE',
	Promise : Promise
});
app.use("/imgs", express.static('./imgs'));
var urlencodedParser = bodyParser.json({ extended: false});
var main= fs.readFileSync('./index.html');
//var mapFile = fs.readFileSync('./map.html');
//var mapHTML = new JSDOM(mapFile.toString());
var mainHTML = new JSDOM(main.toString());
var service;
var map;
var chicago;
var directionsService;
var directionsRender;
function generateWaypts(homeLoc,weight, distance) {
			const northLat = homeLoc.lat+distance/4/69*weight;
			const eastLng = homeLoc.lng+distance/4/69/Math.cos(homeLoc.lat)*weight;
			let northwaypt = { lat: northLat, lng: homeLoc.lng };
			let northeastwaypt = { lat: northLat, lng: eastLng };
			let eastwaypt = { lat: homeLoc.lat, lng: eastLng };
			waypts = [northwaypt, northeastwaypt, eastwaypt];
			return waypts;

}
function calcRouteDistance(route) {
	var legs = route.legs;
	var totalDistance = 0;
	for(var i=0; i < legs.length; i++) {
		totalDistance += legs[i].distance.value/1609.34;

	}
	return totalDistance;

}
async function getRoute(location, distance) {
	var request = {
		input: location,
		inputtype: 'textquery',
		language: 'en',
		fields: ['name', 'geometry'],
	};

	const response = await googleMapsClient.findPlace(request).asPromise().then((response) => { return response });
	if(response.status == 200) {
		let routeNotFound = true;
		let weight = 1;
		while(routeNotFound) {
			let locationCoords = response.json.candidates[0].geometry.location;
			let waypts = generateWaypts(locationCoords,weight, distance);

			let req = {
				origin: locationCoords,
				destination: locationCoords,
				waypoints: waypts,
				mode: 'walking'
			};

			let estDist = await googleMapsClient.directions(req)
			.asPromise()
			.then( (res) => {
				if (res.status == 200) {
					return calcRouteDistance(res.json.routes[0]);	
				}
				else {
					console.log(result);
				}
			});	
			console.log(estDist.toFixed(2));
			if(estDist.toFixed(2) <= parseInt(distance)+0.3) {
				return { waypts: waypts, distance: estDist};
				routeNotFound = false;
				console.log(estDist);
			}
			else {
				weight -= 0.03;
			}
			
		}
	}
	else {
		console.log(response.status == 200);
	}
}
app.post('/', urlencodedParser, (req, res) => {
	console.log(req.body);
	if(req.body.distance > 10) {
		res.status(200).send();
	}
	else {
		getRoute(req.body.location, req.body.distance).then( (route) => {
			//console.log(route);
			res.status(200).send(route);
		});
	}

});
app.get('/', (req, res) => {
	console.log("getting data");
	res.end(mainHTML.serialize());
});
	

const server = app.listen(process.env.PORT || 3001, () => {
	console.log('Server is running at 3001');
});
