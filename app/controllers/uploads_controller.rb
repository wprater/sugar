class UploadsController < ApplicationController

	requires_authentication
	requires_user
	
  def create
    mime_type   = MIME::Types.of(params[:file].original_filename).first
    media_type  = mime_type.media_type
    sub_type    = mime_type.sub_type
    
    # Determine if we're dealing with images or other assets
    asset = PostAsset.new({
      :name => params[:name],
      :mime_type => mime_type,
      :uploaded_by => @current_user.id,
      :is_temp => true
    })
    # Use the correct Carrierwave mount based on asset type
    if 'image' == media_type
      asset.image = params[:file] if 'image' == media_type

      out_method = :image
    else
      # Support doc, pdf, and/or application types
      asset.file = params[:file] if %w{
        vnd.ms-excel
        vnd.ms-word
        pdf
      }.include?(sub_type) \
      || # Search the media types 
      %w{
        text
      }.include?(media_type)

      out_method = :file
    end
    
    asset.save

    render :json => asset, :methods => [out_method]
  end
end