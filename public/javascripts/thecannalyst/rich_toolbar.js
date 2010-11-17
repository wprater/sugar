(function ($S) {
    
    // Remove unwanted buttons from the RichTextArea Toolbar
    $($S).bind('richtextinit', function () {
        if ($(Sugar.richTextArea).length > 0) {
            Sugar.richTextArea.toolbar.removeButton('Escape HTML');
        }
    });
    
})(Sugar);