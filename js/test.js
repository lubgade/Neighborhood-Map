$(function(){
 getYelpReviews();

 });


function getYelpReviews(){
        var yelpRequestUrl = "https://api.yelp.com/oauth2/token";
        var app_id = 'CWLGp_F0hob5KO8sy-ZNww';
        var app_secret = '5e5iLrJNv36MR5ks7FAlmH2PVxgrM14dijyXzSyDmcw9HrmAGpOOnPzqK6podLWA';

        $.ajax({
            url: "http://localhost:8080/token"
            //url: "https://api.yelp.com/oauth2/token",
            type: "POST",
            data: {
                grant_type: 'client_credentials',
                client_id: 'CWLGp_F0hob5KO8sy-ZNww',
                client_secret: '5e5iLrJNv36MR5ks7FAlmH2PVxgrM14dijyXzSyDmcw9HrmAGpOOnPzqK6podLWA'
            },
            contentType: 'application/x-www-form-urlencoded',
            crossDomain: true,
            cache: true,
            success: function(result){
                console.log('in success');
                console.log(result);
            },
            error: function(){
                window.alert('sorry something went wrong');
            }

        });
        }
