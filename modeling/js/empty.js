class Empty extends SuperModel{
	constructor( scene ){
		super( scene );
		this.instructionString = `Please select a model 
                                  from the dropdown selector 
                                  in the top left of the page.`;
        this.modalContent = `Welcome. This webpage contains demos 
       						 I created in order to learn more about ThreeJS
       						 and javascript in general. You can use the dropdown
       						 selector in the top-right corner to switch between
       						 different demos. Enjoy!`
	}
}