(function ($S) {
    
    // Remove unwanted buttons from the RichTextArea Toolbar
    $($S).bind('richtextinit', function(evt, tb) {
        tb.removeButton('Escape HTML');
    });
    
})(Sugar);