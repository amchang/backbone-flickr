$(document).ready(function(){
	var coll = new AC.Collection.Photo();
	var search = new AC.View.Search({
		collection: coll
	});
	$("#header").append(search.el);
});
