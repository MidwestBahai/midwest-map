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
census_mws <- census_shp1 %>% dplyr::filter(STATEFP=="18" | STATEFP=="26" | STATEFP=="39")
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

m_23 <- ggplot()+
  geom_sf(data=c1, aes(fill = m_23), size=0.1) + 
  scale_fill_viridis(option="plasma")+
  geom_sf(data=sr1, lwd=10, fill=NA, color="white") + 
  coord_sf(datum = NA)+
  theme_map()+
  ggtitle('2023') + 
  theme(legend.position="right",
        plot.title = element_text(hjust = 0.5,color = "Gray40", size = 16, face = "bold"),
        plot.subtitle = element_text(color = "blue"),
        plot.caption = element_text(color = "Gray60"))+
  guides(fill = guide_legend(title = "Milestone", title.position = "bottom", title.theme =element_text(size = 10, face = "bold",colour = "gray70",angle = 0)))

m_24 <- ggplot()+
  geom_sf(data=c1, aes(fill = m_24), size=0.1) + 
  scale_fill_viridis(option="plasma")+
  geom_sf(data=sr1, lwd=10, fill=NA, color="white") + 
  coord_sf(datum = NA)+
  theme_map()+ 
  ggtitle('2024')+
  theme(legend.position="right",
        plot.title = element_text(hjust = 0.5,color = "Gray40", size = 16, face = "bold"),
        plot.subtitle = element_text(color = "blue"),
        plot.caption = element_text(color = "Gray60"))+
  guides(fill = guide_legend(title = "Milestone", title.position = "bottom", title.theme =element_text(size = 10, face = "bold",colour = "gray70",angle = 0)))

m_27 <- ggplot()+
  geom_sf(data=c1, aes(fill = m_27), size=0.1) + 
  scale_fill_viridis(option="plasma")
  geom_sf(data=sr1, lwd=10, fill=NA, color="white") + 
  coord_sf(datum = NA)+
  theme_map() + 
  ggtitle('2027')+
  theme(legend.position="right",
        plot.title = element_text(hjust = 0.5,color = "Gray40", size = 16, face = "bold"),
        plot.subtitle = element_text(color = "blue"),
        plot.caption = element_text(color = "Gray60"))+
  guides(fill = guide_legend(title = "Milestone", title.position = "bottom", title.theme =element_text(size = 10, face = "bold",colour = "gray70",angle = 0)))

combined <- m_22 + m_23 + m_24 + m_27 & theme(legend.position = "bottom")                                             
combined + plot_layout(guides= "collect", ncol=4) + plot_annotation(title = 'Midwestern States 9YP Goal Forecast')