"use strict";


(function(){
	function setup(){

		var html 				= document.getElementsByTagName('HTML')[0],
			em_width			= parseInt(html.getAttribute('em-width')) || 32,
			total_width 		= window.innerWidth

		if(em_width) html.style.fontSize = (total_width / em_width) + 'px'

	}

	setup()

	var window_on_resize = window.onresize || function(){}

	window.onresize = function(){
		setup()
		window_on_resize()
	}

})()