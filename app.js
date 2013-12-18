$(document).ready(function(){
	$('#submit').click(function(){
		var validInfo = true;
		var textAreaValue = $("#criteriaWords").val();		
	
		$("#settings :input").each(function(){			
			var inputValue = $(this).val();					
			if(inputValue.trim().length <= 0){					
				validInfo = false;
			}
		});
	
		if(!validInfo){
			alert("Please fill all the fields");
		}else if(textAreaValue.trim().length <= 0){
			alert("Please fill all the fields");
		}else{
			var data = $('#settings').serialize();
			$('#configMessage').empty().html("Configuration Saved!!!");
			$.ajax({
				url: 'submit', 
				type: 'POST', 			
				data: data,
				success: function(msg) {					
					$('#configMessage').empty().html(msg);								
				},
				error: function(){
					$('#configMessage').empty().html("Error saving configuration!!!");
				}
			});
		}
		
	});

	$('form').submit(function(e){
		e.preventDefault();
	});
});