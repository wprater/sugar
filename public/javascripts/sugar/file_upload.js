/*jslint browser: true, devel: true, onevar: false, regexp: false, immed: false*/
/*global window: false, jQuery: false, $: false, Sugar: false, FB: false*/

(function ($S) {
    
    $($S).bind('ready', function () {
        this.FileUpload.init();
    });
    
    $S.FileUpload = {
        init: function () {
            this.hasRichTextArea = $('form ul.richTextToolbar').length > 0;
            if (!this.hasRichTextArea) {
                return;
            }
            
            this.exchangeForm = $('form.new_discussion, form.edit_discussion, form.livePost').eq(0);
            this.uploadContainerName = 'image-upload-wrap';
            this.objectName = $('form').find('input[name=object_name]')[0].value;
            
            this.setupInterface();
            this.initUploader();
            this.setupEvents();
            
            this.uploader.init();
            // Have to hide after the button has been setup
            $('#filelist').hide();
        },
        
        setupEvents: function() {
            this.uploader.bind('Init', this.onUploaderInit.bind(this));
            this.uploader.bind('FilesAdded', this.onFilesAdded.bind(this));
            this.uploader.bind('UploadProgress', this.onUploadProgress.bind(this));
            this.uploader.bind('Error', this.onUploadError.bind(this));
            this.uploader.bind('FileUploaded', this.onFileUploaded.bind(this));
            $('#uploadfiles').click(this.onUploadFilesClick.bind(this));
        },
        
        setupInterface: function() {
            this.addUploadBar();
            this.addUploadImageToolbarButton();
            $('#filelist').append('<a id="uploadfiles" ><span>Upload files</span></a>');
            $('#uploadfiles').hide();
        },
        
        initUploader: function() {
            this.uploader = new plupload.Uploader({
                runtimes : 'html5,flash,silverlight,browserplus',
                browse_button : 'pick-file',
                container : 'upload-files-cont',
                max_file_size : '10mb',
                url : '/discussions/file_upload',
                flash_swf_url : '/javascripts/vendor/plupload/plupload.flash.swf',
                silverlight_xap_url : '/javascripts/vendor/plupload/plupload.silverlight.xap',
                filters : [
                    {title : "Image files", extensions : "jpeg,jpg,gif,png"},
                    {title : "Pdf files", extensions : "pdf"},
                    // TODO virus scanning
                    {title : "Other files", extensions : "doc,txt,docx"},
                    {title : "Zip files", extensions : "zip"}
                ],
                multipart: true,
                multipart_params: {
                    authenticity_token: Sugar.authToken(this.exchangeForm)
                }
            });
        },
        
        onUploaderInit: function(up, params) {
            // $('#filelist').html("<div>Current runtime: " + params.runtime + "</div>");
        },
        
        onUploadFilesClick: function(e) {
            this.uploader.start();
            e.preventDefault();
        },
        
        onFilesAdded: function(up, files) {
            $.each(files, function(i, file) {
                $('#filelist').prepend(
                    '<div id="' + file.id + '">' +
                    file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
                '</div>');
            });
            up.refresh(); // Reposition Flash/Silverlight
            
            $("#uploadfiles").show();
        },
        
        onUploadProgress: function(up, file) {
            $('#' + file.id + " b").html(file.percent + "%");
        },
        
        onFileUploaded: function(up, file, res) {
            response = jQuery.parseJSON(res.response);
            
            $('#' + file.id + " b").html("100%");

            // Sugar.ta.toolbar.textArea.replaceSelection(
            //     '<img src="' + response.file.url + '" alt="' + response.name + '" />');
            
            // Insert hidden field with asset_id
            $('#new_' + this.objectName).append($("<input />")
              .attr("type","hidden")
              .addClass('post_tmp_asset_ids')
              .attr("name", this.objectName + '[tmp_asset_ids][]')
              .val(response._id)
            );
        },
        
        onUploadError: function(up, err) {
            $('#filelist').append("<div>Error: " + err.code +
                ", Message: " + err.message +
                (err.file ? ", File: " + err.file.name : "") +
                "</div>"
            );
            up.refresh(); // Reposition Flash/Silverlight
        },
        
        addUploadBar: function() {
            var container = document.createElement('div');
            $(container).insertAfter('form ul.richTextToolbar').attr('id', 'filelist')
                .append('<div id="upload-files-cont" />');
            $('#upload-files-cont')
                .append('<a hre="#" id="pick-file">Attach or upload file..</a>');
        },
        
        addUploadImageToolbarButton: function() {
            if (!Sugar.ta) { return; }
            
            var buttonName = 'Image Upload';
            Sugar.ta.toolbar.addButton(buttonName, function() {
                $(this).toggleClass('active');
                $('#filelist').toggle();
            });
            // var button = $(Sugar.ta.toolbar.buttons).last().eq(0);
            // button.find('a').wrap('<div title="' + buttonName + '" id="'+ this.uploadContainerName +'">');
            // this.browseButtonName = button.find('a').attr('id');
        }
    };
    
})(Sugar);