/*
 * Copyright 1996 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

#include <stdio.h>
#include "var.h"
#include "const.h"
#include "functions.h"
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <stdarg.h>

int comNumber=0;

void compress_board(unsigned char *a,BTYPE *b)
/* stores the board b in a compressed format: a=compress(b) */
{
    int i;

    for(i=0;i<25;i++) a[i]=16*b[map[2*i]]+b[map[2*i+1]];
}

void strong_compress_board(unsigned char *a,BTYPE *b)
/* stores the board b in a compressed format: a=compress(b) , 17 bytes */
{
    int i;

    for(i=0;i<16;i++) a[i]=b[map[3*i]]+6*b[map[3*i+1]]+36*b[map[3*i+2]];
    a[16]=b[map[3*16]]+6*b[map[3*16+1]];
}

void decompress_board(BTYPE *a,unsigned char *b)
/* decompresses the board b: a=decompress(b) */
{
    int i;

    for(i=0;i<25;i++) {
        a[map[2*i]]=b[i]/16;
        a[map[2*i+1]]=b[i]&15;
    }
}

void set_col(int fg,int bg)
{
    if (usecol==true) printf("\033[%i;%im",fg,bg);
}

void res_col(void)
{
    if (usecol==true) printf("\033[m");
}

FILE * my_fopen(char *name,char *m)
{
    FILE *test;
    char file[256];

    test=fopen(name,m);
    if (test==NULL) {
        strcpy(file,WORKDIR);
        strcat(file,name);
        test=fopen(file,m);
    }
    return(test);
}

int bin_size(char *name,int size,void *array)
/* array points at enough memory to hold data + 16 bytes!!! */
{
    FILE *in;
    int n;

    in=my_fopen(name,"rb");
    if (in==NULL) {
        dprint("binload failed to open '%s'\n",name);
        return(false);
    }
    fscanf(in,"%i\n",&n);
    fclose(in);
    return(n);
}

int bin_load(char *name,int size,void *array)
/* array points at enough memory to hold data + 16 bytes!!! */
{
    FILE *in;
    int n,i,j;
    char temp[16],endian[16];

    in=my_fopen(name,"rb");
    if (in==NULL) {
        dprint("binload failed to open '%s'\n",name);
        return(false);
    }
    fscanf(in,"%i\n",&n);
    for(i=0;i<16;i++) fscanf(in,"%c",&endian[i]);
    dprint("%i %i\n",size,n);
    fread(array,size,n,in);
    for(i=0;i<16;i++) if (endian[i]!=i) {
            dprint("endian reversal detected; reversing\n");
            for(i=0;i<size*n;i+=16) {
                for(j=0;j<16;j++) temp[i]=*((char*)array+i+j);
                for(j=0;j<16;j++) *((char*)array+i+endian[j])=temp[j];
            }
            break;
        }
    return(n);
}


int bin_save(char *name,int n,int size,void *array)
{
    FILE *out;
    int i;

    dprint("bin_save:%s %i %i %x\n",name,n,size,array);
    out=fopen(name,"wb");

    if (out==NULL) {
        dprint("binsave fail to opened '%s'\n",name);
        return(0);
    }
    fprintf(out,"%i\n",n);
    for(i=0;i<16;i++) fprintf(out,"%c",i); /* endian check */
    fwrite(array,size,n,out);
    fclose(out);
    return(n);
}

void store_history(char *move,int eval,int nodes)
{
    if (game_history_nr>=200) return;
    compress_board(game_history[game_history_nr].board,board);
    movecopy(game_history[game_history_nr].move,move);
    sprintf(game_history[game_history_nr].comment,"score:%.3f,  eval: %i",(float)(eval/1000.0F),nodes);
    game_history_nr++;
    game_color=1-game_color;
}

void winShowHistory(void)
{
    int i;
    char buffer[256];
    int gg;
    
    gg=game_color^(game_history_nr&1);
    
    if (windows==true) {
        winprint("\n");
        winprint("PDN|%i|%i|%i|%s|%s|%s|%s|%s|%s|%s|",game_history_nr,game_history_max,gg,pdn_info.whitepl,pdn_info.blackpl,pdn_info.result,pdn_info.date,pdn_info.event,pdn_info.site,pdn_info.round);
        for(i=0;i<game_history_max;i++) {
            print_move(game_history[i].move);
            if (game_history[i].comment[0]!=0) winprint(" {%s}",game_history[i].comment);
            winprint("|");
        }
        if (strcmp(pdn_info.result,"*")==0 || strcmp(pdn_info.result,"")==0) {
            winprint("...");
        } else {    
            winprint("%s",pdn_info.result);
        }
    }
    winprint("\n");
}

void xstore_history(char *move,char *comment)
{
    if (game_history_nr>=199) return;
    compress_board(game_history[game_history_nr].board,board);
    movecopy(game_history[game_history_nr].move,move);
    strncpy(game_history[game_history_nr].comment,comment,MAXCOMMENT);
    game_history_nr++;
    game_history_max=game_history_nr;
    game_color=1-game_color;
    sprintf(pdn_info.result,"*");
}

void take_back(int b)
/* takes back 'b' moves. Use b<0 to go forward */
{
    int old;

    old=game_history_nr;
    if (game_history_nr==0 && b>0) {
        dprint("can not take back\n");
        return;
    }
    game_history_nr-=b;
    if (game_history_nr<0) {
        dprint("can not take back more\n");
        game_history_nr=0;
    }
    if (game_history_nr>game_history_max) {
        dprint("can not take forward more\n");
        game_history_nr=game_history_max;
    }
    /* return board state to before the move was made */
    if (game_history_nr<game_history_max || game_history_nr==0 ) {
        decompress_board(board,game_history[game_history_nr].board);
    } /* if we are on the last move, use board of previous move and redo the last move */
    else {
        decompress_board(board,game_history[game_history_nr-1].board);
        do_move(game_history[game_history_nr-1].move);
    }
    set_pieces();

    if (game_history_nr<game_history_max) {
        //dprint("proposed move: ");
        //print_move(game_history[game_history_nr].move);
        //dprint(" '%s'\n",game_history[game_history_nr].comment);
    }
    fflush(stdout);
    game_color=game_color^((old-game_history_nr)&1);
    display_board();
    winShowHistory();
}

void show_history(int verbose)
{
    int i;

    for(i=0;i<game_history_max;i++) {
        if (i%2==0) dprint("%i. ",i/2+1);
        print_move(game_history[i].move);
        if (verbose>1) dprint(" {%s}",game_history[i].comment);
        if (i%2==0) {
            if (verbose>0) dprint("    "); else dprint(" ");
        }
        else {
            if (verbose>0 || (verbose==0 && i%8==7)) dprint("\n"); else dprint(" ");
        }
    }
    dprint("\n");
}

int xparse(char a,char b)
{
    int x,y;
    x=a-'a';
    y=b-'1';
    if (x<0 || x>9 || y<0 || y>9) return(-1);
    if ((x+y)%2==1) return(-1);
    return(lmap[x][9-y]+1);
}

float alloc_time(int color)
{
    int ml;
    float at;
    float maxTime;
    float timeLeft;
    int nt;
    int whiteMoves;
    
    whiteMoves=(game_history_nr >>1)<<1;
    
    if (whiteMoves<timeControlMoves) {
        ml=(timeControlMoves-whiteMoves)/2;
        maxTime=timeForFirstControl;
    } else {
        nt=(game_history_nr-timeControlMoves)/timeControlMoves2+1;
        ml=(timeControlMoves+nt*timeControlMoves2-whiteMoves)/2;
        maxTime=timeForFirstControl+nt*timeForSecondControl;
    }
    if (ml<0) ml=0;
    ml+=3;
    timeLeft=maxTime-timeUsed[color];
    at=(timeLeft-time_reserve)/ml-operator_time;
    if (at>.4*timeLeft) {
        at=.5*timeLeft;
    }
    if (at<.02) at=.02;
    dprint("moves left: %i, time left:%f  time used: %f alloc time:%f\n",ml,timeLeft,timeUsed[color],at);
    return(at);
}

int try_move(int c,int in1,int in2)
/* returns number of found moves */
{
    int nmoves,nr,found=0;
    int o1,o2;
    char move[MOVEL];

    o1=in1;
    o2=in2;
    if (in1>50 || in2>50 || in1<1 || in2<1) {
        dprint("Illegal move. %i-%i\n",o1,o2);
        return(true);
    }
    in1=map[in1-1]; in2=map[in2-1];
    {
        nmoves=move_list(0,c);
        for(nr=0;nr<nmoves;nr++) {
            if (in1==movelist[0][nr][1] && in2==movelist[0][nr][movelist[0][nr][0]-1]) {
                found++;
                movecopy(move,movelist[0][nr]);
            } 
        }
    }
    if (found==0) {dprint("Illegal move. %i-%i\n",o1,o2); return(0);}
    /*else if (found>1) {dprint("Ambigious move.\n"); return(true);}*/
    else if (found==1) {
        xstore_history(move,"");
        do_move(move);
    }
    return(found);
}

void exportFEN(FILE *out,BTYPE *local)
{
    int i,j,found,p,pc;
        
    for (j=0;j<4;j++) {
        found=false;
        if (j==0) { pc=white|man; }
        if (j==1) { pc=white|crown; }
        if (j==2) { pc=black|man; }
        if (j==3) { pc=black|crown;}

        for (i=0;i<50;i++) {
            p=map[i];
            if (local[p]==pc) {
                if (j==0 && found==false) { fprintf(out,"WP"); pc=white|man; found=true; }
                if (j==1 && found==false) { fprintf(out,"WK"); pc=white|crown; found=true; }
                if (j==2 && found==false) { fprintf(out,"BP"); pc=black|man; found=true; }
                if (j==3 && found==false) { fprintf(out,"BK"); pc=black|crown; found=true;}
                
                if (i<9) fprintf(out,"0");
                fprintf(out,"%i",i+1);
            }
        }
    }
}

void write_dw2(FILE *out)
{
    BTYPE local[93];
    int i,j,pc,p;
    int gg;

    gg=game_color^(game_history_nr&1);
    if (game_history_max==0) {
        winprint("MSGBOX|There are no moves");
        return;
    }

    decompress_board(local,game_history[0].board);
    if (game_history_max==0) {
        copy_board(local,board);            
    }
    
    fprintf(out,"<!-- Exported by Dragon draughts. Applet by damweb.nl -->\n");
    fprintf(out,"<APPLET\n");
    fprintf(out,"    CODEBASE = \"http://www.damweb.nl/\" \n");
    fprintf(out,"    CODE = \"webdam.Viewer.class\"\n");
    fprintf(out,"    NAME = \"webdam\"\n");
    fprintf(out,"    ARCHIVE =\"webdam/Viewer.jar\"\n");
    fprintf(out,"    WIDTH = 360\n");
    fprintf(out,"    HEIGHT = 240\n");
    fprintf(out,"    HSPACE = 0\n");
    fprintf(out,"    VSPACE = 0\n");
    fprintf(out,"    ALIGN = middle>\n");
    fprintf(out,"        <PARAM NAME=\"options\" VALUE=\"bgcolor: b0c0a0; notation:right\">\n");
    fprintf(out,"        <PARAM NAME=\"position\" VALUE=\"");
    if (gg==0) fprintf(out,"WM");
    if (gg==1) fprintf(out,"BM");
    exportFEN(out,local);
    
    fprintf(out,"\">\n");
    fprintf(out,"        <PARAM NAME=\"notation\" VALUE=\"");
    for (i=0;i<game_history_max;i++) {
        j=game_history[i].move[0];
        p=invmap[game_history[i].move[1]]+1;
        if (p<10) fprintf(out,"0");
        fprintf(out,"%i",p);
        p=invmap[game_history[i].move[j-1]]+1;
        if (p<10) fprintf(out,"0");
        fprintf(out,"%i",p);        
    }
    fprintf(out,"\">\n");
    fprintf(out,"</APPLET>\n");
}

void write_dw(char *file)
/* damweb java applet */
{
    
    FILE *out;
    out=fopen(file,"w");
    if (out==NULL) {
        dprint("dw_write: not possible to save '%s'\n",file);
        return;
    }
    fprintf(out,"<HTML>\n");
    write_dw2(out);
    fprintf(out,"</HTML>\n");
    fclose(out);
    /* inform windows interface that game was saved */
    winprint("\n");
    winprint("SAVEDW\n");
}
int isStartingPosition(BTYPE *local)
{
    int r,i;
    
    r=true;
    for (i=0;i<20;i++) if (local[map[i]]!=(black|man)) r=false;
    for (i=20;i<30;i++) if (local[map[i]]!=empty) r=false;
    for (i=30;i<50;i++) if (local[map[i]]!=(white|man)) r=false;
    
    return(r);
}

void writeFen(FILE *out,BTYPE *local,int gg,int mode)
/* writes a FEN position to the file
  gg=color to move
*/
{
    int found;
    int col;
    int p;
    int i;
    
    fprintf(out,"[Setup \"1\"]");
    if (mode==0) fprintf(out,"\n");
    if (mode==1) fprintf(out,"<br>\n");
    fprintf(out,"[FEN \"");
    if (gg==0) fprintf(out,"W");
    if (gg==1) fprintf(out,"B");
    for (col=0;col<2;col++) {
        if (col==0) {fprintf(out,":W");  }
        if (col==black) {fprintf(out,":B");  }
        found=false;
        for (i=0;i<50;i++) {
            p=map[i];
            if ((local[p]&1)==col && local[p]!=empty) {
                if (found==true) fprintf(out,",");
                found=true;
                if ((local[p]==(white|crown)) || (local[p]==(black|crown))) fprintf(out,"K");
                fprintf(out,"%i",i+1);
            }
        }
    }
    fprintf(out,".\"]\n");
    /* inform windows interface that game was saved */
    winprint("\n");
    winprint("SAVEDCP\n");
}

void write_pdnFen(char *file)
{
    FILE *out;
    struct tm *date;
    time_t t;
    t=time((time_t *)NULL);
    date=gmtime(&t);
    
    out=fopen(file,"w");
    if (out==NULL) {
        dprint("pdn_write: not possible to save '%s'\n",file);
        return;
    }
    fprintf(out,"[Event \"\"]\n");
    fprintf(out,"[Date \"%.4i.%.2i.%.2i\"]\n",(int)date->tm_year+1900,(int)date->tm_mon+1,date->tm_mday);
    fprintf(out,"[Site \"\"]\n");
    fprintf(out,"[White \"%s\"]\n",pdn_info.whitepl);
    fprintf(out,"[Black \"%s\"]\n",pdn_info.blackpl);
    fprintf(out,"[Result \"%s\"]\n","*");
    fprintf(out,"[GameType \"20\"]\n");
    writeFen(out,board,game_color,0);
    fprintf(out,"\n*\n");
    
    fclose(out);
}


void beep(void)
{
    dprint("\007");
}

void reverse_board(BTYPE *out,BTYPE *in)
{
/*    int i,q1,q2;

    for(i=0;i<93;i++) out[i]=invalid;
    for(i=0;i<50;i++) {
        q1=map[i];
        q2=map[49-i];
        out[q1]=in[q2]^1;
        if (out[q1]==1) out[q1]=0;
    }*/
    out[0]=invalid;
    out[1]=invalid;
    out[2]=invalid;
    out[3]=invalid;
    out[4]=invalid;
    out[5]=invalid;
    out[6]=invalid;
    out[7]=invalid;
    out[8]=invalid;
    out[9]=invalid;
    out[10]=invalid;
    out[11]=invalid;
    out[12]=invalid;
    out[13]=invalid;
    if (in[76]!=0) {out[14]=in[76]^1;} else {out[14]=0;}
    if (in[75]!=0) {out[15]=in[75]^1;} else {out[15]=0;}
    if (in[74]!=0) {out[16]=in[74]^1;} else {out[16]=0;}
    if (in[73]!=0) {out[17]=in[73]^1;} else {out[17]=0;}
    if (in[72]!=0) {out[18]=in[72]^1;} else {out[18]=0;}
    out[19]=invalid;
    if (in[70]!=0) {out[20]=in[70]^1;} else {out[20]=0;}
    if (in[69]!=0) {out[21]=in[69]^1;} else {out[21]=0;}
    if (in[68]!=0) {out[22]=in[68]^1;} else {out[22]=0;}
    if (in[67]!=0) {out[23]=in[67]^1;} else {out[23]=0;}
    if (in[66]!=0) {out[24]=in[66]^1;} else {out[24]=0;}
    out[25]=invalid;
    out[26]=invalid;    
    if (in[63]!=0) {out[27]=in[63]^1;} else {out[27]=0;}
    if (in[62]!=0) {out[28]=in[62]^1;} else {out[28]=0;}
    if (in[61]!=0) {out[29]=in[61]^1;} else {out[29]=0;}
    if (in[60]!=0) {out[30]=in[60]^1;} else {out[30]=0;}
    if (in[59]!=0) {out[31]=in[59]^1;} else {out[31]=0;}
    out[32]=invalid;
    if (in[57]!=0) {out[33]=in[57]^1;} else {out[33]=0;}
    if (in[56]!=0) {out[34]=in[56]^1;} else {out[34]=0;}
    if (in[55]!=0) {out[35]=in[55]^1;} else {out[35]=0;}
    if (in[54]!=0) {out[36]=in[54]^1;} else {out[36]=0;}
    if (in[53]!=0) {out[37]=in[53]^1;} else {out[37]=0;}
    out[38]=invalid;
    out[39]=invalid;
    if (in[50]!=0) {out[40]=in[50]^1;} else {out[40]=0;}
    if (in[49]!=0) {out[41]=in[49]^1;} else {out[41]=0;}
    if (in[48]!=0) {out[42]=in[48]^1;} else {out[42]=0;}
    if (in[47]!=0) {out[43]=in[47]^1;} else {out[43]=0;}
    if (in[46]!=0) {out[44]=in[46]^1;} else {out[44]=0;}
    out[45]=invalid;
    if (in[44]!=0) {out[46]=in[44]^1;} else {out[46]=0;}
    if (in[43]!=0) {out[47]=in[43]^1;} else {out[47]=0;}
    if (in[42]!=0) {out[48]=in[42]^1;} else {out[48]=0;}
    if (in[41]!=0) {out[49]=in[41]^1;} else {out[49]=0;}
    if (in[40]!=0) {out[50]=in[40]^1;} else {out[50]=0;}
    out[51]=invalid;
    out[52]=invalid;
    if (in[37]!=0) {out[53]=in[37]^1;} else {out[53]=0;}
    if (in[36]!=0) {out[54]=in[36]^1;} else {out[54]=0;}
    if (in[35]!=0) {out[55]=in[35]^1;} else {out[55]=0;}
    if (in[34]!=0) {out[56]=in[34]^1;} else {out[56]=0;}
    if (in[33]!=0) {out[57]=in[33]^1;} else {out[57]=0;}
    out[58]=invalid;
    if (in[31]!=0) {out[59]=in[31]^1;} else {out[59]=0;}
    if (in[30]!=0) {out[60]=in[30]^1;} else {out[60]=0;}
    if (in[29]!=0) {out[61]=in[29]^1;} else {out[61]=0;}
    if (in[28]!=0) {out[62]=in[28]^1;} else {out[62]=0;}
    if (in[27]!=0) {out[63]=in[27]^1;} else {out[63]=0;}
    out[64]=invalid;
    out[65]=invalid;
    if (in[24]!=0) {out[66]=in[24]^1;} else {out[66]=0;}
    if (in[23]!=0) {out[67]=in[23]^1;} else {out[67]=0;}
    if (in[22]!=0) {out[68]=in[22]^1;} else {out[68]=0;}
    if (in[21]!=0) {out[69]=in[21]^1;} else {out[69]=0;}
    if (in[20]!=0) {out[70]=in[20]^1;} else {out[70]=0;}
    out[71]=invalid;
    if (in[18]!=0) {out[72]=in[18]^1;} else {out[72]=0;}
    if (in[17]!=0) {out[73]=in[17]^1;} else {out[73]=0;}
    if (in[16]!=0) {out[74]=in[16]^1;} else {out[74]=0;}
    if (in[15]!=0) {out[75]=in[15]^1;} else {out[75]=0;}
    if (in[14]!=0) {out[76]=in[14]^1;} else {out[76]=0;}
    out[77]=invalid;
    out[78]=invalid;
    out[79]=invalid;
    out[80]=invalid;
    out[81]=invalid;
    out[82]=invalid;
    out[83]=invalid;
    out[84]=invalid;
    out[85]=invalid;
    out[86]=invalid;
    out[87]=invalid;
    out[88]=invalid;
    out[89]=invalid;
    out[90]=invalid;
    out[91]=invalid;
    out[92]=invalid;
}

void copy_board(BTYPE *out,BTYPE *in)
{
    int i;

    for(i=0;i<93;i++) out[i]=in[i];
}

void resetClock()
{
    timeUsed[0]=0.0;
    timeUsed[1]=0.0;
}

void init_history()
{
    game_history_nr=0;
    game_history_max=0;
    game_history_firstcolor=white;
    sprintf(pdn_info.result,"*");
    resetClock();
    winShowHistory();
}

void init_board(void)
{
    int i;

    for(i=0;i<93;i++) board[i]=invalid;
    for(i=0;i<20;i++) board[map[i]]=black | man;
    for(i=20;i<30;i++) board[map[i]]=empty;
    for(i=30;i<50;i++) board[map[i]]=white | man;
    board[invalid]=invalid;
    init_history();
    set_pieces();
    game_color=white;
}

void save_board(int color,char *name)
{
    int p,x,y;
    FILE *out;

    out=fopen(name,"w");
    if (out==NULL) {dprint("error opening file\n"); return;}
    fprintf(out,"# DCP 1.00\n# game: draughts\n# format: board\n# author: unset\n");
    p=0;
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) fprintf(out,"  ");
            else {
                switch(board[map[p]]) {
                case empty:        fprintf(out,".."); break;
                case white | man: fprintf(out,"wO"); break;
                case white | crown: fprintf(out,"wX"); break;
                case black | man: fprintf(out,"bO"); break;
                case black | crown: fprintf(out,"bX"); break;
                default: fprintf(out,"??"); break;
                }
                p++;
            }
        }
        fprintf(out,"\n");
    }
    if (color==white) fprintf(out,"W \n");
    else if (color==black) fprintf(out,"B \n");
    fclose(out);
    /* inform windows interface that position was saved */
    winprint("\n");
    winprint("SAVEDCP\n");
}

void xprintboard(void)
{
    int p,x,y;

    p=0;
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) {
                printf("_");
            }
            else {
                switch(board[map[p]]) {
                case empty: {
                        printf(".");
                        break;
                    }
                case white|man: {
                        printf("w");
                        break;
                    }
                case white|crown: {
                        printf("W");
                        break;
                    }
                case black|man: {
                        printf("b");
                        break;
                    }
                case black|crown: {
                        printf("B");
                        break;
                    }
                }
                p++;
            }
        }
    }
    printf("\n");
    fflush(stdout);
}

void setPlayers(int mycolor)
{
    if (mycolor==white) {
        strcpy(pdn_info.whitepl,"Dragon");
        strcpy(pdn_info.blackpl,"Human");
    }
    else if (mycolor==black) {
        strcpy(pdn_info.whitepl,"Human");
        strcpy(pdn_info.blackpl,"Dragon");
    }
    else {
        strcpy(pdn_info.whitepl,"NotSet");
        strcpy(pdn_info.blackpl,"NotSet");
    }
}

void write_pdn2(FILE *out,int mode)
// writes pdn game to open file
// mode=1 for html mode
{
    int i,found,p,col;
    struct tm *date;
    time_t t;
    char host_name[100];
    t=time((time_t *)NULL);
    date=gmtime(&t);
    BTYPE local[93];
    int gg;
    char nl[16];
    gg=game_color^(game_history_nr&1);
    decompress_board(local,game_history[0].board);
    if (game_history_max==0) {
        copy_board(local,board);            
    }
    
    sprintf(nl,"\n");
    if (mode==1) sprintf(nl,"<br>\n");
    
#ifdef NO_GETHOSTNAME
    strcpy(host_name,"localhost");
#else
    if (gethostname(host_name, 100)!=0) strcpy(host_name,"localhost");
#endif

    if ((pieces[white|man]+pieces[white|crown])==0) {
        sprintf(pdn_info.result,"0-1");
    }
    if ((pieces[black|man]+pieces[black|crown])==0) {
        sprintf(pdn_info.result,"1-0");
    }
    if (theoretic(game_color)==DRAW) {
        sprintf(pdn_info.result,"1/2-1/2");
    }
    fprintf(out,"[Event \"%s\"]%s",pdn_info.event,nl);
    if (pdn_info.date[0]==0) {
        fprintf(out,"[Date \"%.4i.%.2i.%.2i\"]%s",(int)date->tm_year+1900,(int)date->tm_mon+1,date->tm_mday,nl);
    } else {    
        fprintf(out,"[Date \"%s\"]%s",pdn_info.date,nl);
    }
    fprintf(out,"[Site \"%s\"]%s",pdn_info.site,nl);
    fprintf(out,"[White \"%s\"]%s",pdn_info.whitepl,nl);
    fprintf(out,"[Black \"%s\"]%s",pdn_info.blackpl,nl);
    fprintf(out,"[Result \"%s\"]%s",pdn_info.result,nl);
    fprintf(out,"[Round \"%s\"]%s",pdn_info.round,nl);
    fprintf(out,"[GameType \"20\"]%s",nl);
    if (isStartingPosition(local)==false) {
        writeFen(out,local,gg,mode);
    }
    fprintf(out,"%s",nl);
    for(i=0;i<game_history_max;i++) {
        if (i%2==0) fprintf(out,"%i. ",i/2+1);
        fprint_move_pdn(out,game_history[i].move);
        if (game_history[i].comment[0]!=0) {
            if (mode==0) fprintf(out," {%s}",game_history[i].comment);
            if (mode==1) fprintf(out," <font color=#808080>{%s}</font>",game_history[i].comment);
        }
        if (i%8==7 && mode==0) fprintf(out,"\n"); else fprintf(out," ");

    }
    fprintf(out,"%s%s",pdn_info.result,nl);
}

void write_pdn(char *file)
{
    FILE *out;
    out=fopen(file,"w");
    if (out==NULL) {
        dprint("pdn_write: not possible to save '%s'\n",file);
        return;
    }
    write_pdn2(out,0);
    fclose(out);
    /* inform windows interface that game was saved */
    winprint("\n");
    winprint("SAVEPDN\n");
}

void display_board(void)
{
    int x,y,p=0,bg,fg;
    char t[8];
    int i;
    int theoScore;
    int dtwScore;
    
    theoScore=theoretic(game_color);
    if (theoScore==UNKNOWN) {
        theoScore=theo_alfabeta(-INF,INF,game_color,MAXPLY-10,100,1);
     }
    
    dtwScore=theoreticDTW(game_color);
    
    FILE *out;
    winprint("\n");
    winprint("BOARD|%i|%i~%i|%s|%s|",game_color,theoScore,dtwScore,pdn_info.whitepl,pdn_info.blackpl);
    //dprint("bbb %i\n",game_history_nr);
    if (game_history_nr>0 && windows==true) print_move(game_history[game_history_nr-1].move);
    winprint("|");
    p=0;
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) {
                bg=44;
                set_col(46,46);
                printf("  ");
                res_col();
            }
            else {
                winprint("%i",board[map[p]]);
                switch(board[map[p]]) {
                case empty: {
                        set_col(34,44);
                        printf("..");
                        res_col();
                        break;

                    }
                case white | man: {
                        set_col(37,44);
                        printf("ww");
                        res_col();
                        break;
                    }
                case white | crown: {
                        set_col(37,44);
                        printf("WW");
                        res_col();
                        break;
                    }
                case black | man: {
                        set_col(31,44); set_col(1,1);
                        printf("bb");
                        res_col();
                        break;
                    }
                case black | crown: {
                        set_col(31,44); set_col(1,1);
                        printf("BB");
                        res_col();
                        break;
                    }
                case OPTION: {
                        set_col(33,44); set_col(1,1);
                        printf(",,");
                        res_col();
                        break;
                    }
                default: printf("??"); break;
                }
                p++;
            }
        }
        printf("\n");
    }
    if (windows==true) {
        int nmoves;
        
        nmoves=move_list(MAXPLY-1,game_color);
        winprint("|%i|",nmoves);
        for (i=0;i<nmoves;i++) {
            print_move(movelist[MAXPLY-1][i]);
            winprint("|");
        }
    }
    if (usexv==true) {
        save_board(white,"/tmp/board");
        system("dtp -in /tmp/board -out /tmp/board.ppm");
    }
    winprint("\n");
}

void read_board(char *buffer,FILE *in,int xx,int yy)
{
    int x,y,p=0,mp;
    for(y=0;y<yy;y++) {
        for(x=0;x<xx;x++) {
            if ((x+y)%2==1) {
                mp=map[p];
                board[mp]=empty;
                if (buffer[2*x]=='w' || buffer[2*x]=='W') board[mp]|=white;
                if (buffer[2*x]=='b' || buffer[2*x]=='B') board[mp]|=black;
                if (buffer[2*x+1]=='O' || buffer[2*x+1]=='w' || buffer[2*x+1]=='b') board[mp]|=man;
                if (buffer[2*x+1]=='X' || buffer[2*x+1]=='W' || buffer[2*x+1]=='B') board[mp]|=crown;
                if (buffer[2*x]==',' || buffer[2*x]=='?') board[mp]=OPTION;
                p++;
            }
        }
        fgets(buffer,4000,in);
    }
}

void read_list(char *buffer,int color)
{
    int p,n,str=2;
    int piece;

    do {
        n=sscanf(buffer+str,"%i",&p);
        do str++; while(buffer[str]!=','); str++;
        piece=man; if (buffer[str-2]=='*') piece=crown;
        if (n>0) board[map[p-1]]=piece|color;
    } while(n>0);
}

void read_solution(char *buffer)
{
    int i,j,nmoves;

    nmoves=buffer[2]-48;
    for(i=0;i<nmoves;i++) {
        for(j=0;j<32;j++) PV[0][i][j]=buffer[3+32*i+j]-32;
    }
    PV[1][0][0]=nmoves;
}

int load_board(char *filename)
{
    int p;
    FILE *in;
    char buffer[4000];

    in=my_fopen(filename,"r");
    if (in==NULL) {dprint("file not found\n"); return(false);}
    strcpy(dcpfile,filename);
    for(p=0;p<50;p++) board[map[p]]=empty;
    do {
        fgets(buffer,4000,in);
        if (buffer[0]==' ') read_board(buffer,in,10,10);
        if (buffer[0]=='W' && buffer[1]==':') read_list(buffer,white);
        else if (buffer[0]=='B' && buffer[1]==':') read_list(buffer,black);
    else if (buffer[0]=='W' && buffer[1]==' ') {game_color=white; }
        else if (buffer[0]=='B' && buffer[1]==' ') {game_color=black;}
        else if (buffer[0]=='@') read_solution(buffer);
    } while (!feof(in));
    fclose(in);
    init_history();
    return(true);
}

void init_var(void)
{
    int i,j,x,y,p=0,d;
    int col,xx,yy,m;
    int rnd[50]={
                    158348979, 271443740, 917110337, 672394140, 471741934, 108428288,
                    746123302, 851148097, 668205810, 971697407, 23865000,  113593368,
                    788288248, 667473021, 780119145, 885552817, 451359320, 771282457,
                    162534553, 437004112, 934713875, 399087624, 929047756, 795327023,
                    696804160, 229755822, 844868352, 159571484, 339467453, 516687944,
                    784687804, 444304431, 752169198, 11086258,  8914330,   534983178,
                    371807931, 239110026, 698648990, 313948582, 711627924, 303307709,
                    584346480, 300873399, 187335317, 451607092, 945652566, 437207155,
                    206363717, 465963450
                };
    /* time: may give some portability problems */
    struct tm *date;
    time_t t;
    int c,dx,dy;
    
    t=time(NULL);
    date=gmtime(&t);
    srand(date->tm_sec+60*date->tm_min+3600*date->tm_hour);
    game_history_nr=0; game_color=white;
    for(p=0;p<93;p++) if (invmap[p]>=0) map[invmap[p]]=p;
    for(p=0;p<93;p++) if (invmap[p]>=0) reverse_map[49-invmap[p]]=p;
    for(p=0;p<93;p++) blocked[p]=true;
    reverse_color[empty]=empty;
    reverse_color[white|man]=black|man;
    reverse_color[black|man]=white|man;
    reverse_color[white|crown]=black|crown;
    reverse_color[black|crown]=white|crown;

    /* directional arrays */
    for(col=0;col<2;col++) for(p=0;p<93;p++) for(d=0;d<4;d++)
                next[col][p][d]=invalid;
    p=0;
    for(y=0;y<10;y++) for(x=0;x<10;x++) {
            if ((x+y)%2==1) {lmap[x][y]=p++;}
        }
    p=0;
    for(y=0;y<10;y++) for(x=0;x<10;x++) {
            if ((x+y)%2==1) {
                xx=x-1; yy=y-1;
                m=lmap[xx][yy];
                if (xx>=0 && yy>=0 && xx<10 && yy<10) {

                    next[white][map[p]][forleft]=map[m];
                    next[black][map[p]][backright]=map[m];
                }
                xx=x+1; yy=y-1;
                m=lmap[xx][yy];
                if (xx>=0 && yy>=0 && xx<10 && yy<10) {
                    next[white][map[p]][forright]=map[m];
                    next[black][map[p]][backleft]=map[m];
                }
                xx=x-1; yy=y+1;
                m=lmap[xx][yy];
                if (xx>=0 && yy>=0 && xx<10 && yy<10) {
                    next[white][map[p]][backleft]=map[m];
                    next[black][map[p]][forright]=map[m];
                }
                xx=x+1; yy=y+1;
                m=lmap[xx][yy];
                if (xx>=0 && yy>=0 && xx<10 && yy<10) {
                    next[white][map[p]][backright]=map[m];
                    next[black][map[p]][forleft]=map[m];
                }
                p++;
            }
        }
    for(c=0;c<2;c++) {
        int s;
        if (c==0) s=1;
        if (c==1) s=-1;
        
        for(y=0;y<10;y++) {
            for(x=0;x<10;x++) {
                if ((x+y)%2==1) {
                    p=lmap[x][y];
                    
                    for(dx=-9;dx<=9;dx++) {
                        for(dy=-9;dy<=9;dy++) {
                            if (x+s*dx>=0 && y-s*dy>=0 && x+s*dx<10 && y-s*dy<10 && ((dx-dy)%2)==0) {
                                nextall[c][map[p]][10+dx][10+dy]=map[lmap[x+s*dx][y-s*dy]];
                            }
                            else {
                                nextall[c][map[p]][10+dx][10+dy]=invalid;
                            }
                        }
                    }
                }
            }
        }
    }
                                    
    /* promotion */
    for(i=0;i<50;i++) {
        promote[white][map[i]]=white|man;
        promote[black][map[i]]=black|man;
    }
    for(i=0;i<5;i++) promote[white][map[i]]=white|crown;
    for(i=45;i<50;i++) promote[black][map[i]]=black|crown;
    /* hash randoms */
    for(i=0;i<50;i++) for(j=0;j<6;j++) hash_rnd[i][j]=rnd[i]*j;
    init_stats();
    test_nr=0;
    for(i=0;i<93;i++) xray_w[i]=xray_b[i]=0;
    strcpy(pdn_info.whitepl,"Player");
    strcpy(pdn_info.blackpl,"Dragon Draughts");
}

void init_tstats(void)
/* statistics that should be reset before the thinking process */
{
    tneval=0LL;
    init_stats();
}

void init_stats(void)
/* statistics that should be reset before each alpha-beta iteration */
{
    int i,j,k;

    nsort=neval=ngen=ndat=inhash=outhash=nmat=nmovelist=nquiet=nquietfail=precount=dbfail=ineval=outeval=pat_try=pat_found=pat_succes=0;
    for(i=0;i<MAXPLY;i++) deval[i]=0;
    for(i=0;i<MPV;i++) for(j=0;j<MPV;j++) PV[i][j][0]=0;
    for(i=0;i<4096;i++) db_usage[i]=0;
    for(i=0;i<8;i++) pieces[i]=0;
    for(i=0;i<50;i++) pieces[board[map[i]]]++;
    for(i=0;i<9;i++) varCount[i]=0;
    
    if (kill_method==PROBKILL) for(k=0;k<20;k++) for(i=0;i<150;i++) for(j=0;j<20;j++) history[k][i][j]=20;
    else for(k=0;k<20;k++) for(i=0;i<150;i++) for(j=0;j<20;j++) history[k][i][j]=0;
    for(i=0;i<2;i++) for(j=0;j<150;j++) for(k=0;k<150;k++) countermove[i][j][k]=0;
}

void set_pieces(void)
{
    int i;
    pieces[2]=pieces[3]=pieces[4]=pieces[5]=0;
    for(i=0;i<50;i++) pieces[board[map[i]]]++;
}

void print_db_namefromnr(int i)
/* prints a database type in format XXvXO. Input is a database number */
{
    /*dprint("%i%i%i%i",i%8,(i/8)%8,(i/64)%8,(i/512)%8);*/
    dprint("%s",database_name(i%8,(i/8)%8,(i/64)%8,(i/512)%8));
}

void print_stats(void)
/* prints statistics of the search process */
{
    int i,n,wman,bman,wcrown,bcrown;
    float nper;
    INT64 totdb=0LL;
    
    if (neval!=0) nper=100.0F*ndat/neval;
    else nper=0;
    printf("    deval: ");
    for(i=0;i<MAXPLY;i++) if (deval[i]!=0) dprint("%i:%i, ",i,deval[i]);
    winprint("|");
    printf("\n");
    for(i=0;i<4096;i++) if (db_usage[i]!=0) {
            printf("    ndat: ");
            break;
        }
    for(i=0;i<4096;i++) totdb+=db_usage[i];
    for(i=0;i<10;i++) if (varCount[i]!=0) {
        dprint("var %i: %i ",i,varCount[i]);
    }
    for(n=2;n<=12;n++) for(i=0;i<4096;i++) if (db_usage[i]!=0) {
                wman=i%8; wcrown=(i/8)%8; bman=(i/64)%8; bcrown=(i/512)%8;
                if ((wman+wcrown+bman+bcrown)==n) {
                    dprint("%s:%.1f%%, ",database_short_name(wman,wcrown,bman,bcrown),(100.0*db_usage[i]/totdb));
                }
            }
    winprint("|");
    for(i=0;i<4096;i++) if (db_usage[i]!=0) {
            printf("\n");
            break;
        }
    dprint("    #eval:%llu #mat:%llu #preeval %llu #ml:%llu #quiet:%llu (%llu) #ngen:%llu in:%llu out %llu #db:%llu (%.1f%%) #ex:%llu #dbfail:%llu #ine:%llu #oute:%llu  pat:%llu/%llu/%llu\n",neval,nmat,precount,nmovelist,nquiet,nquietfail,ngen,inhash,outhash,ndat,nper,nsort,dbfail,ineval,outeval,pat_try,pat_found,pat_succes);
    winprint("|");
    /*printf("pieces:%i:%i:%i:%i\n",pieces[2],pieces[3],pieces[4],pieces[5]);*/
}

void movecopy(char *a,char *b)
{
    memcpy(a,b,sizeof(char)*(b[0]+1));
}

int movecmp(char *a,char *b)
/* returns 0 if two moves are equal */
{
    int i;

    if (a[0]!=b[0]) return(1);

    for (i=1;i<a[0];i++) if (a[i]!=b[i]) return(1);
    return(0);
}

int reverse_movecmp(char *a,char *b)
/* returns 0 if two moves are equal */
{
    int i;

    if (a[0]!=b[0]) return(1);

    /* check from field */
    if (reverse_map[invmap[a[1]]]!=b[1]) return(1);
    if (a[0]==4) if (reverse_map[invmap[a[3]]]!=b[3]) return(1);
        else {
            for(i=4;i<=a[0];i+=3) if (reverse_color[a[i]]!=b[i]) return(1);
            for(i=3;i<=a[0];i+=3) if (reverse_map[invmap[a[i]]]!=b[i]) return(1);
        }
    for(i=5;i<a[0];i+=3) if (reverse_map[invmap[a[i]]]!=b[i]) return(1);
    /* for(j=5;j<m;j+=3) if (reverse_map[invmap[a[j]]]!=b[j]) return(1);*/
    return(0);
}

int text_to_move(char *movestring,int color,char *move)
{
    int in1,in2,nr,found=0,nmoves,i;

    /*for(i=0;i<strlen(movestring);i++) if (movestring[i]='x') movestring[i]='-'
    */
    sscanf(movestring,"%i%*c%i",&in1,&in2);
    in1=map[in1-1]; in2=map[in2-1];
    nmoves=move_list(0,color);
    for(nr=0;nr<nmoves;nr++) {
        if (in1==movelist[0][nr][1] && in2==movelist[0][nr][movelist[0][nr][0]-1]) {
            found++;
            movecopy(move,movelist[0][nr]);

        }
    }

    if (found!=1) return(false);
    return(true);
}

void reverse_on_board(void)
{
    BTYPE temp[93];
    copy_board(temp,board);
    reverse_board(board,temp);
}

void convert_93to50(char *b)
{
    int ip;

    for(ip=0;ip<50;ip++) b[ip]=board[map[ip]];
}

void convert_50to93(char *b)
{
    int i,ip;

    for(i=0;i<93;i++) board[i]=invalid;
    for(ip=0;ip<50;ip++) board[map[ip]]=b[ip];
}

char *neatNumber(DBINDEX index)
{
    static char name[40];
    char temp[40];
    int n;
    int i;
    int k;
    
    if (sizeof(DBINDEX)==4) sprintf(temp,"%u",index);
    if (sizeof(DBINDEX)==8) sprintf(temp,"%llu",index);
    n=strlen(temp);
    
    k=0;
    for (i=0;i<=n;i++) {
        name[k++]=temp[i];
        if ((n-i-1)%3 == 0 && i<(n-1)) {
            name[k++]='.';
        }
    }
    /*sprintf(name,"%i",n);*/
    return(name);
}

void dprint( char* format, ... )
/* print to both the windows and terminal interface */
{
    char buffer[4000];
    char ren[256];
    int hasNewLine=0;
    int i;
    FILE *out;
    va_list arglist;
    va_start( arglist, format );
    vsprintf( buffer,format, arglist );
    printf("%s",buffer);
    va_end( arglist );
    
    if (windows==true) {
        /* printing to windows-interface */
        out=fopen("com/tmp.tmp","a");
        if (out==NULL) {printf("warning: can not open interface file\n"); return;}
        fprintf(out,"%s%\000",buffer);
        fclose(out);
        for(i=0;buffer[i]!=0;i++) {
            if (buffer[i]==13 || buffer[i]==10) {
                hasNewLine=true;
            }
    
        }
        if (hasNewLine==true) {
            sprintf(ren,"com/%i.txt",comNumber);
            rename("com/tmp.tmp",ren);
            comNumber++;
        }
    }
}

void winprint( char* format, ... )
/* print to the windows interface only */
{
    char buffer[1000];
    char ren[256];
    int hasNewLine=0;
    int i;

    if (windows==true) {
        FILE *out;
        va_list arglist;
        va_start( arglist, format );
        vsprintf( buffer,format, arglist );
        va_end( arglist );
        
        /* printing to windows-interface */
        out=fopen("com/tmp.tmp","a");
        if (out==NULL) {printf("warning: can not open interface file\n"); return;}
        fprintf(out,"%s",buffer);
        fclose(out);
        for(i=0;buffer[i]!=0;i++) {
            if (buffer[i]==13 || buffer[i]==10) {
                hasNewLine=true;
            }
        }
        if (hasNewLine==true) {
            
            sprintf(ren,"com/%i.txt",comNumber);
            rename("com/tmp.tmp",ren);
            comNumber++;
        }
    }
}

void dscanf(char *format, ...)
/* read from windows/terminal interface */
{
    FILE *in;
    va_list arglist;
    va_start( arglist, format );
    if (windows==false) {
        vscanf( format, arglist );
    }
    else {
        /* read from windows interface */
        while(true) {
            in=fopen("com/win.in","r");
            if (in==NULL) {
                usleep(10000);
                continue;
            }          
            vfscanf( in,format, arglist );
            fclose(in);
            unlink("com/win.in");
            break;
        }
    }
    va_end( arglist );
}    

FILE *winGetFile()
/* return a filehandle to read from windows/terminal interface */
{
    FILE *in;
    while(true) {
        in=fopen("com/win.in","r");
        if (in==NULL) {
            usleep(10000);
            continue;
        }
        fclose (in);
        rename("com/win.in","com/win.in2");
        in=fopen("com/win.in2","r");
        return(in);
    }
}    

char *xread(char *res,char *b)
{
    int i;
    for (i=0;;i++) {
        if (b[i]=='|') break;
        res[i]=b[i];
    }
    res[i]=0;
    return(&b[i+1]);
}

int read_wingame()
/* read a game dictacted by the windows interface
  return true if succesful
*/
{
    char buffer[40001];
    char fen[256];
    char *b;
    int n;
    char tmp[128];
    char comment[MAXCOMMENT];
    int nmoves;
    FILE *in;
    int col;
    int v1,v2,j,m,i;
    int found;
    char result[256];
    
    /*in=fopen("com/win.in","r");
    if (in==NULL) {
        return false;
    }*/
           
    init_board();
    n=0;
    /*fscanf(in,"%s",buffer);*/
    dscanf("%40000c",buffer);
    b=buffer;
    printf("pdn: {%s}\n",buffer);
    b=xread(pdn_info.whitepl,b);
    b=xread(pdn_info.blackpl,b);
    b=xread(pdn_info.site,b);
    b=xread(pdn_info.event,b);
    b=xread(pdn_info.date,b);
    b=xread(pdn_info.round,b);
    b=xread(result,b);
    b=xread(fen,b);  /* fen */
    b=xread(tmp,b);
    col=white;
    if (fen[0]!=0) {
        /* fen starting position */
        int pieceType;
        int maxLen;
        int field;
        
        for (i=0;i<50;i++) {
            board[map[i]]=empty;
        }
        maxLen=strlen(fen);
        for (i=2;i<maxLen;) {
            if (fen[i]=='.') { break; }
            if (fen[i]==0) { break; }
            if (fen[i]=='W') { col=white; i+=1;  }
            if (fen[i]=='B') { col=black; i+=1;  }
            pieceType=man;
            if (fen[i]=='K') { pieceType=crown; i+=1;  }
            field=atoi(&fen[i]);
            if (field<10) { i+=2;} 
            else {
                i+=3;
            }
            board[map[field-1]]=pieceType+col;
        }
        if (fen[0]=='W') col=white;
        if (fen[0]=='B') col=black;
        set_pieces();
    }    
    nmoves=0;
    nmoves=atoi(tmp);
    for (i=0;i<nmoves;i++) {
        b=xread(tmp,b);
        b=xread(comment,b);
        v1=atoi(tmp);
        if (v1<10) {
            v2=atoi(&tmp[2]);
        } else {
            v2=atoi(&tmp[3]);
        }
        found=try_move(col,v1,v2);
        if (found==0) return (false);
        /* store comment */
        strncpy(game_history[game_history_nr-1].comment,comment,MAXCOMMENT);
        col=1-col;
    }
    game_color=col;
    winShowHistory();
    strcpy(pdn_info.result,result);
    display_board();
    return(true);
}
