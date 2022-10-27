# BACKGROUND AND MOTIVATION

No one wants to go for a dinner night out, and come back home with an upset stomach. Unfortunately, all of us can relate to that one night where a dinner became unforgettable for all the wrong reasons. That one place which had the tastiest kebabs, but made you violently sick the day after! Couple that with a big city, and you have a possible recipe for a gastro-disaster, pun intended.
</br>Food safety and restaurant hygiene is always a concern when dining out. This has never been more relevant. The COVID-19 pandemic made eating out seem like a distant dream. While restaurants may have finally opened up and life does seem to be getting back to “normal” again, the pandemic has left us all a lot more conscious about hygiene and safety in public places. We wanted to see if there was a way for us to make a visualization that helped folks figure out if a restaurant passed the safety check with as much of a margin as they wished or not. 
</br>We chose New York, since it’s a popular hotspot for tourists and expects a non-local population who may find such a resource useful, and for the abundance and variety of restaurants and cuisines in the city.
# OBJECTIVE
While going through the dataset, we encountered some primary questions that we will try to answer with the help of visualization; they are as follows:
- To allow users to zero in on an area and cuisine, and check the food safety grade of restaurants in that area
- How safety compliant has my restaurant of choice been historically?
- Are some areas of New York more riddled with restaurants committing safety violations than others?
- Are food violations more prevalent in some cuisines than others?
- Do food violations occur more in some months than others?
- What violations are more prevalent month-wise in an area?
- Are big food chain brands better than average at adhering to food safety standards ? The visualization we propose is the average score of big brand food chains around the city. We would like to find insights into the general trend in big stores and their adherence to food safety standards

</br></br>By the end of this project, we would want to be able to compare restaurants and choose the best one for our dinner night out.

# DATA
We have picked our dataset from the following sources
</br>https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j/data 
</br>For the geometry visualization, we have picked our shapefile from
</br>https://data.cityofnewyork.us/Business/Zip-Code-Boundaries/i8iw-xf4u/data?no_mobile=true 
</br>The dataset contains every sustained or not yet adjudicated violation citation from every full or special program inspection conducted up to three years prior to the most recent inspection for restaurants and college cafeterias in an active status on the RECORD DATE (date of the data pull). When an inspection results in more than one violation, values for associated fields are repeated for each additional violation record. Establishments are uniquely identified by their CAMIS (record ID) number. thousands of restaurants start business and go out of business every year; only restaurants in an active status are included in the dataset. 
</br>Records are also included for each restaurant that has applied for a permit but has not yet been inspected and for inspections resulting in no violations. Establishments with an inspection date of 1/1/1900 are new establishments that have not yet received an inspection. Restaurants that received no violations are represented by a single row and coded as having no violations using the ACTION field.
</br>This dataset and the information on the Health Department’s Restaurant Grading website come from the same data source. The Health Department’s Restaurant Grading website is here:
</br>http://www1.nyc.gov/site/doh/services/restaurant-grades.page
</br>See the data dictionary file in the Attachments section of the OpenData website for a summary of data fields and allowable values.
