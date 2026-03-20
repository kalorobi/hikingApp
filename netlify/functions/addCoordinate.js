const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY);

exports.handler = async (event) => {
	if (event.httpMethod !== "POST"){return { statusCode: 405, body: "Method Not Allowed" }; }
	try{
		const params = new URLSearchParams(event.body);
		const lat = parseFloat(params.get("lat"));
		const lng = parseFloat(params.get("lng"));
		const locusTime = params.get("time");
		
		const { error } = await supabase
		.from('coordinates')
		.insert([{ lat, lng, locusTime}]);

		if (error) {return {statusCode: 500, body: JSON.stringify({ error: error.message })};}
		return {statusCode: 200, body: JSON.stringify({status: "ok"})};
	}
	catch (err){return {statusCode: 400, body: JSON.stringify({error: "Invalid JSON"})};}
};
