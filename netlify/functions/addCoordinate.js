const  { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY);

let latestPosition = {lat: null, lng: null, locusTime: null};

exports.handler = async (event) => {
	if (event.httpMethod !== "POST"){
		return { statusCode: 405, body: "Method Not Allowed" }; }
	try{
		const data = JSON.parse(event.body);

		latestPosition = {lat: data.latitude, lng: data.longitude, locusTime: data.time};

		await supabase.from('positions').insert([{latestPosition}]);
		
		return {statusCode: 200, body: JSON.stringify({status: "ok"})};

	}
	catch (err){
		return {statusCode: 400, body: JSON.stringify({error: "Invalid JSON"})};}
};
