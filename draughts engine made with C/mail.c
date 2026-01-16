#include <stdio.h>
#include <string.h>
#include <time.h>

#include "const.h"
#include "var.h"
#include "functions.h"


/* Michel Grimminck 1995 */

struct _game_info {
    char email[100];
    char my_nick[100];
    char op_nick[100];
    int my_col;
} game_info;

int file_copy(char *command,char *fileto,char *filefrom)
{
    FILE *in,*out;
    int c;

    in=fopen(filefrom,"rb");
    if (in==0) {printf("error in filecopy in '%s'\n",filefrom); return(true);}
    out=fopen(fileto,command);
    if (out==0) {fclose(in); printf("error in filecopy out '%s'\n",fileto); return(true);}
    while((c=fgetc(in))!=EOF) fputc(c,out);
    fclose(in);
    fclose(out);
    return(false);
}

void stripn(char *a)
{
    a[strlen(a)-1]=0;
}

int get_game_info(void)
{
    char temp[100];
    printf("what is the e-mail address of your opponent\n> ");
    fgets(game_info.email,100,stdin); stripn(game_info.email);
    printf("what is your name\n> ");
    fgets(game_info.my_nick,100,stdin); stripn(game_info.my_nick);
    printf("what is your opponents name\n> ");
    fgets(game_info.op_nick,100,stdin); stripn(game_info.op_nick);
    printf("are you to play white (y/n)\n> ");
    fgets(temp,100,stdin);
    if (temp[0]=='Y' || temp[0]=='y') game_info.my_col=white;
    else game_info.my_col=black;
}

void write_game_info(char *file)
{
    FILE *out;
    out=fopen(file,"w");
    if (out==NULL) {printf("write error\n");}
    else {
        fprintf(out,"email\n%s\nmy_nick\n%s\nop_nick\n%s\nmy_col\n%i\n",
                game_info.email,
                game_info.my_nick,
                game_info.op_nick,
                game_info.my_col);
        fclose(out);
        game_history_nr=0;
    }
}

void mail_set_pdninfo(void)
{
    if (game_info.my_col==white) {
        strncpy(pdn_info.whitepl,game_info.my_nick,90);
        strncpy(pdn_info.blackpl,game_info.op_nick,90);
    }
    else {
        strncpy(pdn_info.whitepl,game_info.op_nick,90);
        strncpy(pdn_info.blackpl,game_info.my_nick,90);
    }
    pdn_info.event[0]=0;
    pdn_info.date[0]=0;
    pdn_info.site[0]=0;


}

void mailplay(char *name)
{
    char pdn[100],dcp[100],inf[100],dummy[100],mailfile[100],oldmail[100];
    char tmove[100],temp[100];
    FILE *in,*out;
    int player=white,i,movesdone,n,readin=true,new=false,goodmove,err;
    int tt;
    time_t start,end;

    strncpy(inf,name,90);
    strcat(inf,".inf");
    strncpy(pdn,name,90);
    strcat(pdn,".pdn");
    strncpy(dcp,name,90);
    strcat(dcp,".dcp");
    strncpy(mailfile,name,90);
    strcat(mailfile,".mail");
    strncpy(oldmail,name,90);
    strcat(oldmail,".old");

    while (readin==true) {
        in=fopen(inf,"r");
        if (in==NULL) {
            printf("player file '%s' does not exist\n",name);
            printf("Either stop the program or continue creating a new player file\n");
            get_game_info();
            write_game_info(inf);
            strcpy(pdn_info.result,"*");
            mail_set_pdninfo();
            write_pdn(pdn);
            readin=true;
            new=true;
        }
        else { /* read info */
            fgets(dummy,100,in);
            fgets(game_info.email,100,in); stripn(game_info.email);
            fgets(dummy,100,in);
            fgets(game_info.my_nick,100,in); stripn(game_info.my_nick);
            fgets(dummy,100,in);
            fgets(game_info.op_nick,100,in); stripn(game_info.op_nick);
            fgets(dummy,100,in); fgets(dummy,100,in);
            sscanf(dummy,"%d",&game_info.my_col);
            readin=false;
            fclose(in);
        }
    }

    parameters[0]=-4;
    perc=1.0F;
    game_history_nr=check_database(pdn,0,40);
    player=game_history_nr%2;
    do {
        int from,to;
        printf("current position is:\n");
        display_board();
        printf("white timeleft:%i  black timeleft:%i\n",time_left[white],time_left[black]);
        tomove=game_history_nr%2;
        n=move_list(0,tomove);
        printf("possible moves: "); print_movelist(0,n);

        if (tomove==white) printf("White ");
        else printf("Black ");
        if (tomove==game_info.my_col) printf("(you)");
        else printf("(opponent)");
        if (n==0) {
            printf("has no move: game ended.\n");
            if (tomove==white) strcpy(pdn_info.result,"0-1");
            if (tomove==black) strcpy(pdn_info.result,"1-0");
            break;
        }
        else if (n==1) {
            printf(" has only one possible move: ");
            print_move(movelist[0][0]);
            store_history(movelist[0][0],0,0);
            do_move(movelist[0][0]);
            printf("\n");
            continue;
        } else { /* get move */
            printf(", enter your move (nr. %i) or a command.\n> ",game_history_nr/2 +1);
            fgets(dummy,100,stdin); stripn(dummy);
            if (strcmp(dummy,"end")==0 || strcmp(dummy,"quit")==0 ) {
                strcpy(pdn_info.result,"*");
                break;
            }
            else if (strcmp(dummy,"draw")==0) {
                strcpy(pdn_info.result,"1/2-1/2");
                break;
            }
            else if (strcmp(dummy,"1-0")==0) {
                strcpy(pdn_info.result,"1-0");
                break;
            }
            else if (strcmp(dummy,"0-1")==0) {
                strcpy(pdn_info.result,"0-1");
                break;
            }
            else if (strcmp(dummy,"hardquit")==0) {
                printf("not saved!\n");
                exit(0);
            }
            else if (strcmp(dummy,"dragon")==0) {
                int alloc_time,ml;

                ml=((timecontrolply-game_history_nr)/2+3);
                if (ml<3) ml=3;

                alloc_time=0.5*(time_left[tomove]-time_reserve)/ml;
                if (alloc_time<1) alloc_time=1;
                printf("allowed time:%i ml:%i\n",alloc_time,ml);

                time(&start);
                play(tomove,3,alloc_time);
                time(&end);
                time_left[tomove]-=difftime(end,start);
            }
            else if (strcmp(dummy,"show")==0) {
                show_history(0);
            }
            else if (strcmp(dummy,"undo")==0) {
                game_history_nr--;
            }

            else {
                    for(i=0;i<90;i++) if (dummy[i]=='-' || dummy[i]=='x' || dummy[i]=='X' || dummy[i]=='*') tmove[i]=' '; else tmove[i]=dummy[i];
                i=sscanf(tmove,"%i%i",&from,&to);
                if (i<2) {
                    printf("Illegal move.\n");
                    continue;
                }
                if (try_move(tomove,from,to)==true) { /* error, try textmove */
                    ;
                }
            }
        }
    } while(true);
    if (new==false) {
        err=file_copy("w",oldmail,mailfile);
        if (err==true) {
            printf("Unable to make backup-file; this may cause problems with\nother files and may destroy them.\nPress enter if you wish to continue or stop the program.");
            fgets(temp,100,stdin);
        }
    }
    mail_set_pdninfo();
    write_pdn(pdn);
#ifndef SILLY
    save_board(player,"/tmp/board");
#endif
    save_board(player,dcp);
    out=fopen(mailfile,"w");
    if (out==NULL) {printf("error writing .mail\n");return;}
    fprintf(out,"correspondence draughts game\n");
    fprintf(out,"Hello,\n\n");
    fprintf(out,"After making my move this are the moves and position\n");
    fprintf(out,"in our game:\n\n");
    fclose(out);
    file_copy("a",mailfile,pdn);
    file_copy("a",mailfile,dcp);

#ifndef SILLY
    system("dtp -in /tmp/board -out /tmp/board.ppm");
    system("xv /tmp/board.ppm &");
#endif
}


