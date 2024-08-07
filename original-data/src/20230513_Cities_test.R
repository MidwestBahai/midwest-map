setwd("G:/My Drive/RBCMWS_Maps")
here::i_am("src/data_prep.R")

#load all necessary libraries after downloading to your R package
library(tidyverse)
library(spdep)
library(sf)
library(ggplot2)
library(stringr)
library(viridis)
library(cowplot)
library(patchwork)
library(ggmap)

#read dataset - first write out the paths that are needed and name them 

d1 <- "G:/My Drive/RBCMWS_Maps/data/MWS_Cluster_Data_V1.csv"
s1 <- "G:/My Drive/RBCMWS_Maps/data/mwsClusters20181129.shp"
c1 <- "G:/My Drive/RBCMWS_Maps/data/cb_2018_us_county_500k"

#read dataset - read each path according to the type of file 
data1 <-read_csv(d1)
shape1 = st_read(s1)
census_shp1 <- st_read(c1)


# plot roy's shape file - use ggplot to start and then add the geom_sf to load your shp file - add title and then - add coordinators with coord_sf
ggplot() + 
  geom_sf(data = shape1, size = 3, color = "black", fill = "lightsteelblue1") + 
  ggtitle("Midwestern States Region") + 
  coord_sf()

##starting to build your own shape file and dataset 

#remove other states from census shape file - move all the other states except the ones that we need - look up state codes 
census_mws <- census_shp1 %>% dplyr::filter(STATEFP=="18" | STATEFP=="26" | STATEFP=="39"| STATEFP=="17" | STATEFP=="34" |STATEFP=="42" | STATEFP=="55" |STATEFP=="21" | STATEFP=="54")
census_mws$afp <- paste(census_mws$STATEFP, census_mws$COUNTYFP)

#merge data with census shape file 
data1$`County FIPS` <- str_pad(data1$`County FIPS`, 3, pad = "0")
data1$afp <- paste(data1$`State FIPS`,data1$`County FIPS`)

final <- left_join(census_mws, data1, by="afp")
check <- data1 %>% count(afp)

#map tucker map 
ggplot() + 
  geom_sf(data = final, size = 3, color = "black", fill = "lightsteelblue1") + 
  ggtitle("Midwestern States Region") + 
  coord_sf()

#group by cluster name 
c1 <- final %>% 
  group_by(Cluster) %>%
  summarise(geometry = sf::st_union(geometry)) %>%
  ungroup() 

#map clusters
ggplot() + 
  geom_sf(data = c1, size = 3, color = "black", fill = "lightsteelblue1") + 
  ggtitle("Midwestern States Region") + 
  coord_sf()

#merge data into shapefile of clusters
cluster_data <- data1 %>% dplyr::distinct(Cluster, .keep_all=TRUE)
cluster_data <- cluster_data %>% select(-(6:11), -County, -FIPS, -afp)
c1 <- c1 %>% left_join(cluster_data, by="Cluster") 
c1 <- c1 %>% rename(m_22=6, m_23=7, m_24=8, m_25=9, m_26=10, m_27=11, m_28=12, m_29=13, m_30=14, m_31=15)

#group by subregion 
sr1 <- final %>% 
  group_by(`Sub-Region`) %>%
  summarise(geometry = sf::st_union(geometry)) %>%
  ungroup() 

#map milestones
m_22 <- ggplot()+
  geom_sf(data=c1, aes(fill = m_22), size=0.1) + 
  scale_fill_viridis(option="plasma")+
  geom_sf(data=sr1, lwd=10, fill=NA, color="white") + 
  coord_sf(datum = NA)+
  theme_map()+ ggtitle('2022')+ 
  theme(legend.position="right",
        plot.title = element_text(hjust = 0.5,color = "Gray40", size = 16, face = "bold"),
        plot.subtitle = element_text(color = "blue"),
        plot.caption = element_text(color = "Gray60"))+
  guides(fill = guide_legend(title = "Milestone", title.position = "bottom", title.theme =element_text(size = 10, face = "bold",colour = "gray70",angle = 0)))

  
combined <- m_22 & theme(legend.position = "bottom")                                             
combined + plot_layout(guides= "collect", ncol=4) + plot_annotation(title = 'Midwestern States 9YP Goal Forecast')



#city data

in_sfg <- st_point(c(39.768611, -86.158056)) #Indianapolis
fw_sfg <- st_point(c(41.080556, -85.139167)) #FortWayne
ct_sfg <- st_point(c(42.098056, -86.484167)) #ClayTwp
mk_sfg <- st_point(c(41.6675, -86.171389)) #Mishawaka
sb_sfg <- st_point(c(-86.171389, -86.250278)) #SouthBend
bl_sfg <- st_point(c(39.162222, -86.529167)) #Bloomington
mu_sfg <- st_point(c(40.193333, -85.388056)) #Muncie
jf_sfg <- st_point(c(38.295556, -85.731389)) #Jeffersonville
da_sfg <- st_point(c(43.014167, -83.526111)) #DavisonTownship
fl_sfg <- st_point(c(43.018889, -83.693333)) #Flint
ca_sfg <- st_point(c(42.9025, -85.495)) #CascadeTownship
gr_sfg <- st_point(c(42.961111, -85.655556)) #GrandRapids
ho_sfg <- st_point(c(42.7875, -86.108889)) #Holland
el_sfg <- st_point(c(42.73472, -84.480556)) #EastLansing
la_sfg <- st_point(c(42.733611, -84.546667)) #Lansing
mt_sfg <- st_point(c(42.726944, -84.415)) #MeridianTownship
kt_sfg <- st_point(c(42.311111, -85.588056)) #KalamazooTownship
aa_sfg <- st_point(c(42.281389, -83.748333)) #AnnArbor
pt_sfg <- st_point(c(42.2225, -83.714444)) #PittsfieldTownship
yt_sfg <- st_point(c(42.228889, -83.592222)) #YpsilantiTownship
at_sfg <- st_point(c(42.308611, -83.482222)) #CantonTownship
dt_sfg <- st_point(c(42.331389, -83.045833)) #Detroit
ro_sfg <- st_point(c(42.488889, -83.142778)) #RoyalOak
sh_sfg <- st_point(c(42.580278, -83.030278)) #SterlingHeights
tr_sfg <- st_point(c(42.580278, -83.143056)) #Troy
ma_sfg <- st_point(c(46.546389, -87.406667)) #Marquette
cl_sfg <- st_point(c(41.482222, -81.669722)) #Cleveland
cv_sfg <- st_point(c(41.509722, -81.563333)) #ClevelandHeights
hh_sfg <- st_point(c(41.476389, -81.551667)) #ShakerHeights
co_sfg <- st_point(c(39.962222, -83.000556)) #Columbus
we_sfg <- st_point(c(40.123611, -82.921389)) #Westerville
ci_sfg <- st_point(c(39.1, -84.5125)) #Cincinnati
ke_sfg <- st_point(c(39.697222, -84.152222)) #Kettering
cf_sfg <- st_point(c(41.145556, -81.496667)) #CuyahogaFalls
be_sfg <- st_point(c(39.729444, -84.062222)) #Beavercreek
ys_sfg <- st_point(c(39.8, -83.9)) #YellowSprings
ec_sfg <- st_point(c(39.3529, -84.3647)) #WestChesterTownship


#Create basemap
#https://cengel.github.io/R-spatial/mapping.html#adding-basemaps-with-ggmap
#https://www.nceas.ucsb.edu/sites/default/files/2020-04/ggmapCheatsheet.pdf
mws_basemap <- get_map(location=c(-89,37,-80,48), zoom=6, maptype = 'terrain', source = 'stamen')

ggmap(mws_basemap)

#map milestones with basemap
m_22 <- ggplot()+ 
  ggmap(mws_basemap)+
  geom_sf(data=c1, aes(fill = m_22), inherit.aes = FALSE) + 
  scale_fill_viridis(option="plasma")+
  coord_sf(crs = st_crs(4326))
#geom_sf(data=sr1, lwd=10, fill=NA, color="white") + 
#coord_sf(datum = NA)+
theme_map()+ ggtitle('2022')+ 
  theme(legend.position="right",
        plot.title = element_text(hjust = 0.5,color = "Gray40", size = 16, face = "bold"),
        plot.subtitle = element_text(color = "blue"),
        plot.caption = element_text(color = "Gray60"))+
  guides(fill = guide_legend(title = "Milestone", title.position = "bottom", title.theme =element_text(size = 10, face = "bold",colour = "gray70",angle = 0)))

