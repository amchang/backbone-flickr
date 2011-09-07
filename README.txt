To Run:

Just place search.html into your web browser. Ensure not to move it outside of the package folder otherwise scripts,
CSS, and images will not be properly included. Requires connection to the Internet for external scripts and CSS used.

Overview:

I completed the project by dividing it into two parts: visual presentation and page controller logic.

For the visual presentation portion of my project, I really wanted to focus on keeping it as simple as possible
to ensure that my project was easy to use and engaging. This resulted in only having three states that a user might experience 
while using my project (initial landing page, search results, and the details of a photo) and minimal use of CSS and HTML.
The saved photos being visible everywhere but the initial landing page. I also made sure to incorporate 
similar elements from several successful image sharing and  searching site, such as Google Images, 
Flickr, Photobucket, and Facebook, so that components that I did build, such as pagination, would be 
very easy to understand and familiar for users using my project.

For the page controller logic, my main focus was to just what primary objects were needed in the overall project. 
Some of those include search, search results, paginate of search results, details of a picture, and a container for saving photos. 
After that I created objects that were needed by those primary objects to support them.
These objects were designed to be fully encapsulated from each other and only interact when necessary. 
They also, when possible, share code through objects when necessary.

Thanks for reviewing this project I hope you had as much time reviewing it as I've had working on it.

Notes:

- Even if a search may turn up more than 4,000 results, only 4,000 can be viewed at once. These results are public only photos.
- The Flickr REST API returns odd results for extremely seldom search queries. I have found odd results for certain searches.
- I avoided using all plug-ins even though I would of liked to use a template system for HTML creation, something possibly to 
manage Ajax history (because there is none right now), and something possibly for 
browser detection for even better HTML / CSS targeted to specific browsers.
- The project is best viewing using a 1920 X 1280. It's using a semi-static layout, but could be converted to liquid if needed.
- I have used the Singleton pattern and John Resig's script for OO creation even though I wasn't familiar with it. 
I just wanted the challenge and to learn a cool design pattern and something new. I am confident though that I understand and 
used the pattern correctly.