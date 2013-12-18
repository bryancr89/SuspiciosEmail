$(document).ready(function(){
	$('#submit').click(function(){
		var data = $('#settings').serialize();
		$.ajax({
			url: 'submit', 
			type: 'POST', 			
            data: data,
			success: function(msg) {				
				$('#configMessage').html(msg);
				setTimeout(function(){
					$('#configMessage').html("");
				},3000);				
			},
			error: function(){
				$('#configMessage').html("Error saving configuration!!!");
			}
	    });
	});

	$('form').submit(function(e){
		e.preventDefault();
	});
});