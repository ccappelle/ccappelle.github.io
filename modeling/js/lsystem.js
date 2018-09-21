var lsystem = {};

lsystem.rules = {};
lsystem.numRuleEntries = 0;
lsystem.constants = "+-[].*"

lsystem.iterateString  = function ( inputString ){

	outputString = "";

	return outputString;
}

lsystem.instructionString = "Coming Soon";

lsystem.animate = function ( scene, dt, pause=false ){

}

lsystem.clean = function ( scene ){

}

lsystem.init = function ( scene ){
	var inputBox = document.createElement("input");
	inputBox.setAttribute( "type", "text" );
	inputBox.setAttribute( "value", "f" );
	inputBox.setAttribute( "onfocusout", "lsystem.focusOut()" );
	inputBox.setAttribute( "style", "width:180px; position: absolute; left: 10px; top: 10px" );
	inputBox.setAttribute( "id", "seedInput" );

	var specialDiv = document.getElementById( "special" );

	specialDiv.appendChild( inputBox );

	lsystem.createRuleEntry();

	// create plus and minus buttons
	var plusButton = document.createElement( "button" );
	var minusButton = document.createElement( "button" );
	
}

lsystem.focusOut = function () {
    var x = document.getElementById( "seedInput" );
    x.value = x.value.toUpperCase();
}

lsystem.keyDown = function () {

}

lsystem.createRuleEntry = function () {
	
	var textBoxSpacing = 70;
	if ( lsystem.numRuleEntries < 6 ){
		lsystem.numRuleEntries += 1;
		var leftSide = document.createElement("input");
		leftSide.setAttribute( "type", "text" );
		leftSide.setAttribute( "style", "width:20px; position: absolute; left: 10px; top: " + 
					lsystem.numRuleEntries * textBoxSpacing + "px;" );
		var rightSide = document.createElement("input");
		rightSide.setAttribute( "style", "width:140px; position: absolute; left: 50px; top: " + 
					lsystem.numRuleEntries * textBoxSpacing + "px;" );
		var specialDiv = document.getElementById( "special" );
		specialDiv.appendChild( leftSide );
		specialDiv.appendChild( rightSide );
	}
}

lsystem.removeRuleEntry = function () {
	if ( lsystem.numRuleEntries > 1 ){

	}
}