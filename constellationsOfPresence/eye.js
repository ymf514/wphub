class closedEye{

  show(){
    // closed
    noFill();
    strokeWeight(20);
    bezier(width/5, height/2, width*5/20, height/2+10, width*7/20, height/2+10, width*2/5,height/2);
    bezier(width*3/5, height/2, width*13/20, height/2+10, width*15/20, height/2+10,width*4/5,height/2);
   
  }

}
   
class openEye{
  constructor(width, height){
     width=width;
     height=height;
   };
  show(){
    strokeWeight(width /100);
    bezier(width/5, height/2, width*5/20, height/2-R*3/4, width*7/20, height/2-R*3/4, width*2/5, height/2);
     bezier(width/5, height/2, width*5/20, height/2+R*3/4, width*7/20, height/2+R*3/4, width*2/5, height/2);
    //right
      bezier(width*3/5, height/2, width*13/20, height/2-R*3/4, width*15/20, height/2-R*3/4, width*4/5, height/2);
      bezier(width*3/5, height/2, width*13/20, height/2+R*3/4, width*15/20, height/2+R*3/4, width*4/5,height/2);
    //pupil
    fill(0);
     circle(width*6/20,height/2,R);
     circle(width*14/20,height/2,R);
   
  }

}