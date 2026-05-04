/*******************************************************************
* overpass-turbo.eu => .geojson
*
* [out:json][timeout:25];
* relation[route=hiking]({{bbox}});
* out geom({{bbox}});
*********************************************************************/

function overpassToGeoJson(overpass){
	var geoJson = {"type": "FeatureCollection","features": [],};
	var waysList = {"elements" : []};
	var relationCount = 0;
	var coordinatesCount = 0;
	for(let relation = 0; relation < overpass.elements.length; relation++){
		if(overpass.elements[relation].type === "relation"){
			var waysRef = [];
			var relationBounds = [];
			var relationJson = {"type" : "Feature","properties":{"type" : "relation","name" : "", "ways" : [], "jel" : "", "visited" : false,"dirty" : true}, 
								"id" : 0, "geometry" : { "type" : "Polygon", "coordinates" : []}};
			relationJson.id = overpass.elements[relation].id;
			relationJson.properties.name = overpass.elements[relation].tags.name;
			relationJson.properties.jel = overpass.elements[relation].tags.jel

			relationBounds[0] = [overpass.elements[relation].bounds.minlon, overpass.elements[relation].bounds.minlat];
			relationBounds[1] = [overpass.elements[relation].bounds.maxlon, overpass.elements[relation].bounds.minlat];
			relationBounds[2] = [overpass.elements[relation].bounds.maxlon, overpass.elements[relation].bounds.maxlat];
			relationBounds[3] = [overpass.elements[relation].bounds.minlon, overpass.elements[relation].bounds.maxlat];
			relationBounds[4] = [overpass.elements[relation].bounds.minlon, overpass.elements[relation].bounds.minlat];
			relationJson.geometry.coordinates.push(relationBounds);
			
			waysRef = addWayList(overpass.elements[relation], waysList);

			for(let ref = 0; ref < waysRef.length; ref++) {
				relationJson.properties.ways[ref] = waysRef[ref];
			}
			geoJson.features.push(relationJson);
			relationCount = relationCount + 1;
		}	
	}
	for (let ways = 0; ways < waysList.elements.length; ways++) {
		coordinatesCount = coordinatesCount + waysList.elements[ways].geometry.coordinates.length;
		geoJson.features.push(waysList.elements[ways]);
	}
	console.log("Relations: " + relationCount);
	console.log("Ways: " + (waysList.elements.length));
	console.log("Coordinates: " + coordinatesCount);
	return geoJson;
}

function addWayList(overpassElement, waysList) {
	var waysRef = [];
	for(let way = 0; way < overpassElement.members.length; way++) {
	if(overpassElement.members[way].type === "way"){
		if(checkGeometry(overpassElement.members[way].geometry)) {
			waysRef.push(overpassElement.members[way].ref);
			if(!(checkWay(waysList, overpassElement.members[way].ref))) {
				var coordinates = [];
				var wayJson = {"type" : "Feature","properties":{"type" : "way", "relations" : [], "distance" : 0, "visited" : false, "visitedDates" : []},
					"geometry" :{"type" : "LineString","coordinates" : []}, "id" : 0};
				wayJson.id = overpassElement.members[way].ref;
				wayJson.properties.relations[0] = overpassElement.id;
				coordinates = readWayGeo(overpassElement.members[way]);
				wayJson.properties.distance = calculateDistanceWay(coordinates);
				for(g = 0; g < coordinates.length; g++) {
					wayJson.geometry.coordinates[g] = coordinates[g];
				}

				waysList.elements.push(wayJson);
			
			}
			else {
				for(let w = 0; w < waysList.elements.length; w++) {
					if(waysList.elements[w].id === overpassElement.members[way].ref) {
						waysList.elements[w].properties.relations.push(overpassElement.id);
					}
				}
			}
		}
	}
	}
	return waysRef;
}

function checkGeometry(overpassElementMembersGeometry) {
	var geoC = false;

	for(let geo = 0; geo < overpassElementMembersGeometry.length; geo++) {
		if(overpassElementMembersGeometry[geo] != null) {geoC = true;}
	}
	return geoC;
}

function readWayGeo(overpassElementMembers) {
	var coordinates = [];
	if(overpassElementMembers.geometry.length > 0) {
		for(let geometry = 0; geometry < overpassElementMembers.geometry.length; geometry++){
			if(overpassElementMembers.geometry[geometry] != null){
				var coordinate = 
				[overpassElementMembers.geometry[geometry].lon,
				overpassElementMembers.geometry[geometry].lat
				];
				coordinates[coordinates.length] = coordinate;
			}
		}
	}
	return coordinates;
}

function checkWay(waysList, way) {
	for(let w = 0; w < waysList.elements.length; w++) {
		if(waysList.elements[w].id === way) {
			return true;
		}
	}
	return false;
}

function calculateDistanceWay(coordinates) {
	var distance = 0;
	
	for(let coord = 0; coord < coordinates.length-1; coord++) {
		distance = distance + calculateDistanceCoord(coordinates[coord], coordinates[coord+1]);
	}
	return distance;
}

function calculateDistanceCoord(coord1, coord2) {
	const EARTH_RADIUS  = 6371000;

	const toRad = (deg) => deg * (Math.PI / 180);

	const lat1 = toRad(coord1[1]); const lon1 = toRad(coord1[0]);
 	const lat2 = toRad(coord2[1]); const lon2 = toRad(coord2[0]);

	const dLat = lat2 - lat1; const dLon = lon2 - lon1;

	const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Math.round(EARTH_RADIUS * c);
}
