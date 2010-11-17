/*jslint browser: true, devel: true, onevar: false, regexp: false, immed: false*/
/*global window: false, jQuery: false, $: false, Sugar: false, FB: false*/

(function ($S) {
    
    $($S).bind('richtextinit', function(evt, tb) {
        if (!$.isFunction(tb.fileUpload)) {
            tb.fileUpload = new $S.FileUpload(tb);
        }
    });
    
    
    $S.FileUpload = function(tb) {
        this.tb = tb;
        
        this.init();
    };
    
    $S.FileUpload.prototype.init = function() {
        this.exchangeForm   = $(this.tb.textArea).closest('form')
        this.objectName     = this.exchangeForm.find('input[name=object_name]')[0].value;
        this.postId         = this.exchangeForm.find('input[name=post_id]').first().val();
        this.submitAfterUpload = false;
        
        this.imageUploadButtonName  = 'Image Upload';
        this.uploadContainerId      = 'image-upload-wrap-'  + this.exchangeForm.attr('id');
        this.filePickId             = 'file-pick-'          + this.exchangeForm.attr('id');
        
        this.setupInterface();
        this.initUploader();
        this.setupEvents();
        
        // Must hide after uploader is inited
        this.uploadContainer.hide();
    };
    
    $S.FileUpload.prototype.setupEvents = function() {
        // Uploader events
        this.uploader.bind('Init',          $.proxy(this.onUploaderInit, this));
        this.uploader.bind('FilesAdded',    $.proxy(this.onFilesAdded, this));
        this.uploader.bind('UploadProgress',$.proxy(this.onUploadProgress, this));
        this.uploader.bind('Error',         $.proxy(this.onUploadError, this));
        this.uploader.bind('FileUploaded',  $.proxy(this.onFileUploaded, this));
        this.uploader.bind('StateChanged',  $.proxy(this.onUploadStateChanged, this));

        this.exchangeForm.submit($.proxy(this.onFormSubmit, this));
    };
    
    $S.FileUpload.prototype.setupInterface = function() {
        this.addUploadedFilesArea();
        this.addUploadImageToolbarButton();
    };
    
    $S.FileUpload.prototype.initUploader = function() {
        this.uploader = new plupload.Uploader({
            runtimes : 'html5,flash,silverlight,browserplus',
            browse_button : this.filePickId,
            container : this.uploadContainerId,
            max_file_size : '10mb',
            url : this.exchangeForm.attr('action') + '/file_upload',
            flash_swf_url : '/javascripts/vendor/plupload/plupload.flash.swf',
            silverlight_xap_url : '/javascripts/vendor/plupload/plupload.silverlight.xap',
            filters : [
                {title : "Image files", extensions : "jpeg,jpg,gif,png"},
                {title : "Pdf files", extensions : "pdf"},
                // TODO virus scanning
                {title : "Other files", extensions : "doc,txt,docx,xls"},
                {title : "Zip files", extensions : "zip"}
            ],
            multipart: true,
            multipart_params: {
                "authenticity_token": Sugar.authToken(this.exchangeForm),
                post_id: this.postId ? this.postId : ''
            }
        });
        this.uploader.init();
    };
    
    $S.FileUpload.prototype.onUploaderInit = function(up, params) {
        // this.uploadContainer.html("<div>Current runtime: " + params.runtime + "</div>");
    };
    
    $S.FileUpload.prototype.onUploadStateChanged = function(up) {
        // If we're waiting to submit the form until all the files are done uploading
        if (this.submitAfterUpload && this.uploadsFinished()) {
            this.exchangeForm.submit();
            this.hideUploadingSpinner();
        }
    };
    
    $S.FileUpload.prototype.onUploadFilesClick = function(e) {
        this.uploader.start();
        e.preventDefault();
    };
    
    $S.FileUpload.prototype.onFilesAdded = function(up, files) {
        $.each(files, $.proxy(function(i, file) {
            this.uploadContainer.find('.filelist').prepend(
                '<div id="' + file.id + '">' +
                file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
            '</div>');
        }, this));
        up.refresh(); // Reposition Flash/Silverlight
        
        this.uploadContainer.find(".uploadfiles").show();
    };
    
    $S.FileUpload.prototype.onUploadProgress = function(up, file) {
        $('#' + file.id + " b").html(file.percent + "%");

    };
    
    $S.FileUpload.prototype.onFileUploaded = function(up, file, res) {
        var response = $.parseJSON(res.response);
        
        $('#' + file.id + " b").html("100%");

        // Insert hidden field with asset_id
        this.exchangeForm.append($("<input />")
          .attr("type","hidden")
          .addClass('post_tmp_asset_ids')
          .attr("name", this.objectName + '[tmp_asset_ids][]')
          .val(response._id)
        );
    };
    
    $S.FileUpload.prototype.onUploadError = function(up, err) {
        this.uploadContainer.find('.filelist').prepend("<div>Error: " + err.code +
            ", Message: " + err.message +
            (err.file ? ", File: " + err.file.name : "") +
            "</div>"
        );
        up.refresh(); // Reposition Flash/Silverlight

        // this.hideUploadingSpinner();
    };
    
    $S.FileUpload.prototype.onFormSubmit = function(evt) {
        evt.preventDefault();
        
        // If there are not files or they have already been uploaded then submit
        if (this.uploader.files.length == 0 || this.uploadsFinished()) { 
            evt.target.submit();
            return;
        } 
        // If there are files that have not been uploaded then upload and attach
        else if (this.uploader.files.length > 0) {
            this.showUploadingSpinner();

            // handler will submit the form once the files have finished
            this.uploader.start();
            this.submitAfterUpload = true;
        }
    };
    
    $S.FileUpload.prototype.addUploadedFilesArea = function(tb) {
        var container = document.createElement('div');
        this.uploadContainer = $(container).attr('id', this.uploadContainerId).addClass('upload-files-cont')
            .insertAfter(this.tb.listElement)
            .append('<div class="filelist" />')
            .append('<a id="' + this.filePickId + '" href="#">Attach or upload file..</a>')
            .append('<a class="uploadfiles" ><span>Upload files</span></a>');

        this.uploadContainer.find('.uploadfiles').hide()
            .click($.proxy(this.onUploadFilesClick, this));
    };
    
    $S.FileUpload.prototype.addUploadImageToolbarButton = function() {
        this.tb.addButton(this.imageUploadButtonName, $.proxy(this.onButtonClick, this));
    };
    
    $S.FileUpload.prototype.onButtonClick = function(evt) {
        $(evt.target).toggleClass('active');
        this.uploadContainer.toggle();
    };
    
    $S.FileUpload.prototype.uploadsFinished = function() {
        return this.uploader.total.uploaded == this.uploader.files.length;
    };

    $S.FileUpload.prototype.showUploadingSpinner = function() {
        this.statusField = $('#button-container');
        this.oldPostButton = this.statusField.html();
        this.statusField.addClass('posting');
        this.statusField.html('Uploading files..');
    };
    
    $S.FileUpload.prototype.hideUploadingSpinner = function() {
        this.statusField.each(function () {
            $(this).removeClass('posting');
            $(this).html(this.oldPostButton);
        });
    };
    
})(Sugar);