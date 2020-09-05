import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { SocketService } from 'src/app/socket.service';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ToastrService } from 'ngx-toastr';
import { routerNgProbeToken } from '@angular/router/src/router_module';
import { ChatMessage } from './chat'

@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.css'],
  providers: [SocketService]
})

export class ChatBoxComponent implements OnInit {

  @ViewChild('scrollMe', { read: ElementRef }) 
  
  public scrollMe: ElementRef;
  public authToken: any;
  public userInfo: any;
  public receiverId: any;
  public receiverName: any;
  public userList: any = [];
  public disconnectedSocket: boolean;

  public scrollToChatTop:boolean=false;
  

  public previousChatList:any=[];
  public messageText:any;
  public messageList:any=[]; //stores the current message list display in chat box
  public pageValue:number=0;
  public loadingPreviousChat:boolean=false;
  public unseenUserList:any=[];

  public userOnline:boolean=false;
  public userInUnseen:boolean=false;
  public unseenMsg:boolean=false;
  public msgSeen:boolean=false;
  public getUnseen:boolean=false;


  constructor(
    public AppService: AppService,
    public SocketService: SocketService,
    public router: Router,
    private toastr: ToastrService,
    private cd:ChangeDetectorRef
    //public scrollMe:ElementRef
    
  ){

  }
  ngOnInit() {
    
    this.authToken= Cookie.get('authtoken');
    this.userInfo= this.AppService.getUserInfoFromLocalstorage();
    this.receiverId=Cookie.get('receiverId');
    this.receiverName=Cookie.get('receiverName');
   // console.log(this.receiverId,this.receiverName)

    if(this.receiverId!=null && this.receiverId!=undefined && this.receiverId!=''){
      this.userSelectedToChat(this.receiverId,this.receiverName)
    }
    this.checkStatus();
    this.verifyUserConfirmation();
    this.getMessageFromAUser();
  }
    
  public checkStatus:any = ()=>{
    
    if(Cookie.get('authtoken')===undefined || Cookie.get('authtoken')=='' || Cookie.get('authtoken')=== null){

      this.router.navigate(['/']);
      return false;
    }
    else {
      return true;
    }
  }// end checkStatus

  public verifyUserConfirmation : any = () =>{
   // console.log("verifyUserCalled");

    this.SocketService.verifyUser().subscribe((data)=>{
      this.disconnectedSocket=false;
      
      this.SocketService.setUser(this.authToken);
      this.getOnlineUserList()
      //console.log('getUnseenMsgcalledFromVerifyUser')
      this.getUnseenMsg();
    });
  }
  
  public getOnlineUserList : any = () =>{
    
    //console.log("getOnlineUserListCalled");
    this.SocketService.onlineUserList().subscribe((userList)=>{
      console.log(userList)
      
      this.userList=[];
                               
      for(let x in userList){ //x in for-in loop holds the value of key in the object's array, userList is the object's array returned by the server in the observable
      //here key is the userId of the other online users and value is the name.
        let temp={'userId':x, 'name': userList[x], 'unread':0, 'chatting': false}; //name has been given the value of key userid i.e the name of user in the userList(returned by server in observable) array.
        this.userList.push(temp) //this.userList is not the same as userList, this.userList array is created to store the variable temp
      }
      //console.log(this.userList);
     
      if(this.unseenMsg==true){
             
       this.getUnseenMsg();
      }
    });
    console.log(this.userList);
  }

  public userSelectedToChat:any =(id,name)=>{

    this.pageValue=0;

    //console.log("setting user as active");
    
    //setting that user to chatting true
    this.userList.map((user)=>{
      if(user.userId==id){
        user.chatting=true;
        user.unread=0;
      }
      else{
        user.chatting=false;
      }

      if(this.unseenUserList.length>0){
        this.unseenUserList.map((unseenUser)=>{
          if(unseenUser.userId==id){ 
           unseenUser.read=true;
          }
          else{
            unseenUser.read=false;
          }
        })
      }
    })
   // console.log(this.userList);
    Cookie.set('receiverId',id);
    Cookie.set('receiverName',name);

    this.receiverName=name;
    this.receiverId=id;
    this.messageList=[];

    let chatDetails={
      userId:this.userInfo.userId,
      senderId:id
    }
     
    this.SocketService.markChatAsSeen(chatDetails);
    this.cd.detectChanges();
    this.unseenMsg=false;
    console.log(this.receiverName);
    if(this.receiverId!=this.userInfo.userId)
    {
    this.getPreviousChatWithAUser();
    }
    
  
    
  }//end userBtnClick function
  
  public sendMessageUsingKeypress: any = (event:any) => {

    if (event.keyCode === 13) { // 13 is keycode of enter.

      this.sendMessage();

    }

  } // end sendMessageUsingKeypress

  public sendMessage: any = () => {

    if(this.messageText){

      let chatMsgObject:ChatMessage = {
        senderName: this.userInfo.firstName + " " + this.userInfo.lastName,
        senderId: this.userInfo.userId,
        receiverName: Cookie.get('receiverName'),
        receiverId: Cookie.get('receiverId'), 
        message: this.messageText,
        createdOn: new Date()
      } // end chatMsgObject
      console.log(chatMsgObject);
      this.SocketService.SendChatMessage(chatMsgObject)
      

      this.pushToChatWindow(chatMsgObject)
      

    }
    else{
      this.toastr.warning('text message can not be empty')

    }

  } // end sendMessage

  public pushToChatWindow : any =(data)=>{

    this.messageText="";
    this.messageList.push(data);
     this.scrollToChatTop = false;
  }// end push to chat window

  public getMessageFromAUser :any =()=>{
    //console.log('getMessageFromUserCalled');

      this.SocketService.chatByUserId(this.userInfo.userId)
      .subscribe((data)=>{
       

        (this.receiverId==data.senderId)?this.messageList.push(data):this.unseenMsg=true;


        this.toastr.success(`${data.senderName} says : ${data.message}`)

        this.scrollToChatTop=false;
       
        if(this.unseenMsg==true){
          this.getUnseenMsg();
          
        }

      });//end subscribe


  }// end get message from a user 

 
  //Unseen messages
  public getUnseenMsg: any = () => {
    this.SocketService.getUnseenChat(this.userInfo.userId)
      .subscribe((_unseenData) => {
        //console.log(_unseenData);
        if (_unseenData.data != null) {
          this.unseenMsg = true;
          this.unseenUserList = _unseenData.data.map((unseenUser) => {
            let temp;
            let flag: number = 0;
            for (let i in this.userList) {
              if (unseenUser.userId == this.userList[i].userId) {
                this.userList[i].unread++;
                temp = { 'userId': unseenUser.userId, status: 'online', 'name': unseenUser.firstName + ' ' + unseenUser.lastName, 'read': false };
                flag++;
                break;

              }
            }
            if (flag == 0) {
              temp = { 'userId': unseenUser.userId, status: 'Offline', 'name': unseenUser.firstName + ' ' + unseenUser.lastName, 'read': false };

            }
            if (temp == undefined) {
              this.toastr.success('No unseen chats are available');
            }
            else {
              return temp;
            }
          })

          // console.log("Unseen UserList");
          // console.log(this.unseenUserList);      
        }
        else {
          this.unseenMsg = false;
        }

        // console.log(this.userList);



      })
  }

  public getPreviousChatWithAUser:any=()=>{

    
    let previousData=(this.messageList.length>0?this.messageList.slice():[]);
   // console.log("getPreviousChatCalled");

    this.SocketService.getChat(this.userInfo.userId,this.receiverId,this.pageValue*10)
    .subscribe((apiResponse)=>
    {
      //console.log(apiResponse);

      if(apiResponse.status==200){
        this.messageList=apiResponse.data.concat(previousData);
        //console.log("getPreviousMessageList");
        console.log(this.messageList);
      }
      else{
        this.messageList=previousData;
        //console.log("apiResponseNil");
        this.toastr.warning('No Messages available')
      }

      this.loadingPreviousChat=false;
    },
    (err)=>{
      this.toastr.error('some error occured')
    }
    )
    
    
  
  }//end getpreviouschat

  public loadEarlierPageOfChat:any=()=>{
    this.loadingPreviousChat=true;
    this.pageValue++;
    this.scrollToChatTop=true;
    this.getPreviousChatWithAUser();
  }//end loadPreviousChat


  public logout: any = () => {

    this.AppService.logout()
      .subscribe((apiResponse) => {

        if (apiResponse.status === 200) {
          
          Cookie.delete('authtoken');

          Cookie.delete('receiverId');

          Cookie.delete('receiverName');

          this.SocketService.exitSocket()
 
          
          this.router.navigate(['/']);
          

        } else {
          this.toastr.error(apiResponse.message)

        } // end condition

      }, (err) => {
        this.toastr.error('some error occured')


      });

  }// end logout
   
  public showUserName=(name:string)=>{
    this.toastr.success("You are chatting with"+ " " +name);
  }
}
